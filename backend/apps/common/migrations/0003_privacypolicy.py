from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('common', '0002_homebanner_officecontact'),
    ]

    operations = [
        migrations.CreateModel(
            name='PrivacyPolicy',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Р”Р°С‚Р° СЃРѕР·РґР°РЅРёСЏ')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Р”Р°С‚Р° РѕР±РЅРѕРІР»РµРЅРёСЏ')),
                ('title', models.CharField(default='Privacy Policy', max_length=255, verbose_name='Title')),
                ('content', models.TextField(verbose_name='Content')),
                ('is_active', models.BooleanField(default=True, verbose_name='Active')),
            ],
            options={
                'verbose_name': 'Privacy policy',
                'verbose_name_plural': 'Privacy policies',
                'ordering': ['-updated_at'],
            },
        ),
    ]
