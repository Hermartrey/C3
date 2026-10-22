from django.db import migrations

def remove_vpower_fuels(apps, schema_editor):
    FuelType = apps.get_model('core', 'FuelType')
    # Deleting FuelType will cascade delete Inventory and Sale records for these fuel types
    FuelType.objects.filter(name__in=['V-Power Diesel', 'V-Power Racing']).delete()

def noop_reverse(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_passwordresetcode'),
    ]

    operations = [
        migrations.RunPython(remove_vpower_fuels, noop_reverse),
    ]
