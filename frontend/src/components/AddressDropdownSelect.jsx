import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, ChevronDown, Check, Edit3, ListFilter } from 'lucide-react';
import { ZAMBOANGA_DEL_SUR_LOCATIONS, POPULAR_ZAMBOANGA_ADDRESSES } from '../data/zamboangaDelSurLocations';

/**
 * AddressDropdownSelect
 * Provides dropdown selection for complete addresses in Zamboanga del Sur, Philippines.
 * Supports:
 *  - Quick Select dropdown of popular station addresses
 *  - Municipality / City dropdown
 *  - Barangay dropdown
 *  - Optional Street / Purok / Landmark input
 *  - Fallback / toggle for manual custom address
 */
const AddressDropdownSelect = ({ value, onChange, idPrefix = 'branch' }) => {
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');
  const [streetDetail, setStreetDetail] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);

  // Sorted list of municipalities (Pagadian City first, then alphabetical)
  const municipalities = useMemo(() => {
    const list = [...ZAMBOANGA_DEL_SUR_LOCATIONS.municipalities];
    return list.sort((a, b) => {
      if (a.name === 'Pagadian City') return -1;
      if (b.name === 'Pagadian City') return 1;
      return a.name.localeCompare(b.name);
    });
  }, []);

  // Barangays for current municipality
  const currentBarangays = useMemo(() => {
    if (!selectedMunicipality) return [];
    const found = municipalities.find((m) => m.name === selectedMunicipality);
    return found ? found.barangays : [];
  }, [selectedMunicipality, municipalities]);

  // Parse existing address value on mount or external change
  useEffect(() => {
    if (!value) return;

    // Check if the value contains Zamboanga del Sur or matches one of our municipalities
    const matchedMuni = municipalities.find((m) =>
      value.toLowerCase().includes(m.name.toLowerCase())
    );

    if (matchedMuni) {
      setSelectedMunicipality(matchedMuni.name);

      const matchedBrgy = matchedMuni.barangays.find((b) =>
        new RegExp(`\\b${b}\\b`, 'i').test(value)
      );

      if (matchedBrgy) {
        setSelectedBarangay(matchedBrgy);

        // Extract street if present before the barangay
        // e.g. "National Highway, Tiguma, Pagadian City, Zamboanga del Sur, Philippines"
        const parts = value.split(',').map((p) => p.trim());
        const brgyIdx = parts.findIndex((p) => p.toLowerCase() === matchedBrgy.toLowerCase());
        if (brgyIdx > 0) {
          const streetPart = parts.slice(0, brgyIdx).join(', ');
          setStreetDetail(streetPart);
        }
      }
    } else if (value.trim().length > 0 && !selectedMunicipality) {
      // Non-standard address (e.g. legacy address "123 Fuel St") -> enable manual view so admin doesn't lose data
      setIsManualMode(true);
    }
  }, [value, municipalities]);

  const assembleAddress = (street, barangay, municipality) => {
    if (!municipality) return '';
    const parts = [];
    if (street && street.trim()) {
      parts.push(street.trim());
    }
    if (barangay && barangay.trim()) {
      parts.push(barangay.trim());
    }
    parts.push(municipality);
    parts.push('Zamboanga del Sur');
    parts.push('Philippines');
    return parts.join(', ');
  };

  const handleMunicipalityChange = (e) => {
    const muni = e.target.value;
    setSelectedMunicipality(muni);
    setSelectedBarangay('');
    const full = assembleAddress(streetDetail, '', muni);
    onChange(full);
  };

  const handleBarangayChange = (e) => {
    const brgy = e.target.value;
    setSelectedBarangay(brgy);
    const full = assembleAddress(streetDetail, brgy, selectedMunicipality);
    onChange(full);
  };

  const handleStreetChange = (e) => {
    const st = e.target.value;
    setStreetDetail(st);
    const full = assembleAddress(st, selectedBarangay, selectedMunicipality);
    onChange(full);
  };

  const handleQuickSelect = (e) => {
    const selected = e.target.value;
    if (!selected) return;

    // Find matching municipality and barangay
    const matchedMuni = municipalities.find((m) =>
      selected.toLowerCase().includes(m.name.toLowerCase())
    );
    if (matchedMuni) {
      setSelectedMunicipality(matchedMuni.name);
      const matchedBrgy = matchedMuni.barangays.find((b) =>
        new RegExp(`\\b${b}\\b`, 'i').test(selected)
      );
      if (matchedBrgy) {
        setSelectedBarangay(matchedBrgy);
      }
    }
    setStreetDetail('');
    onChange(selected);
  };

  if (isManualMode) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 500 }}>
            Full Address
          </label>
          <button
            type="button"
            onClick={() => setIsManualMode(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              cursor: 'pointer',
              fontSize: '0.72rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: 0
            }}
          >
            <ListFilter size={12} /> Select from Zamboanga del Sur Dropdown
          </button>
        </div>
        <textarea
          id={`${idPrefix}-address-manual`}
          className="input"
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          rows="2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. Tiguma, Pagadian City, Zamboanga del Sur, Philippines"
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.78rem', color: 'var(--text-main)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <MapPin size={13} color="var(--primary)" /> Full Address (Zamboanga del Sur, Philippines)
        </label>
        <button
          type="button"
          onClick={() => setIsManualMode(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: 0
          }}
          title="Switch to manual text input"
        >
          <Edit3 size={11} /> Manual edit
        </button>
      </div>

      {/* Quick Select Popular Complete Addresses */}
      <div>
        <select
          id={`${idPrefix}-quick-address-select`}
          className="input"
          style={{
            padding: '0.4rem 0.65rem',
            fontSize: '0.8rem',
            cursor: 'pointer',
            background: 'var(--bg-card)',
            color: 'var(--text-main)'
          }}
          value={POPULAR_ZAMBOANGA_ADDRESSES.includes(value) ? value : ''}
          onChange={handleQuickSelect}
        >
          <option value="">⚡ Quick Select Complete Address...</option>
          {POPULAR_ZAMBOANGA_ADDRESSES.map((addr) => (
            <option key={addr} value={addr}>
              {addr}
            </option>
          ))}
        </select>
      </div>

      {/* Cascading Dropdowns: Municipality/City + Barangay */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            City / Municipality *
          </label>
          <select
            id={`${idPrefix}-municipality-select`}
            className="input"
            style={{
              padding: '0.45rem 0.65rem',
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: 'var(--bg-card)',
              color: 'var(--text-main)'
            }}
            value={selectedMunicipality}
            onChange={handleMunicipalityChange}
            required={!value}
          >
            <option value="">Select Municipality / City</option>
            {municipalities.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name} ({m.type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Barangay *
          </label>
          <select
            id={`${idPrefix}-barangay-select`}
            className="input"
            style={{
              padding: '0.45rem 0.65rem',
              fontSize: '0.82rem',
              cursor: 'pointer',
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              opacity: !selectedMunicipality ? 0.6 : 1
            }}
            value={selectedBarangay}
            onChange={handleBarangayChange}
            disabled={!selectedMunicipality}
            required={!value}
          >
            <option value="">
              {selectedMunicipality ? 'Select Barangay' : 'Choose City/Town first'}
            </option>
            {currentBarangays.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Street / Purok / Landmark */}
      <div>
        <label style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Street / Purok / Landmark (Optional)
        </label>
        <input
          id={`${idPrefix}-street-input`}
          type="text"
          className="input"
          style={{ padding: '0.4rem 0.65rem', fontSize: '0.82rem' }}
          placeholder="e.g. National Highway, Rizal Avenue, Purok 3"
          value={streetDetail}
          onChange={handleStreetChange}
        />
      </div>

      {/* Address Preview Card */}
      {value ? (
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '8px',
            padding: '0.45rem 0.65rem',
            fontSize: '0.76rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.45rem',
            color: 'var(--text-main)'
          }}
        >
          <Check size={14} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ wordBreak: 'break-word', lineHeight: 1.35 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block' }}>Selected Complete Address:</span>
            <strong>{value}</strong>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px dashed var(--border)',
            borderRadius: '8px',
            padding: '0.4rem 0.65rem',
            fontSize: '0.73rem',
            color: 'var(--text-muted)',
            textAlign: 'center'
          }}
        >
          Please select a Municipality and Barangay from the dropdown above
        </div>
      )}
    </div>
  );
};

export default AddressDropdownSelect;
