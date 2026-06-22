from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('locations', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='office',
            name='email',
            field=models.EmailField(blank=True, max_length=254, verbose_name='Email'),
        ),
        migrations.AddField(
            model_name='office',
            name='instagram',
            field=models.URLField(blank=True, verbose_name='Instagram'),
        ),
        migrations.AddField(
            model_name='office',
            name='tiktok',
            field=models.URLField(blank=True, verbose_name='TikTok'),
        ),
        migrations.AddField(
            model_name='office',
            name='website',
            field=models.URLField(blank=True, verbose_name='Website'),
        ),
        migrations.AddField(
            model_name='office',
            name='map_url',
            field=models.URLField(blank=True, verbose_name='Map URL'),
        ),
    ]
