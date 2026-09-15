from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('knowledge', '0002_initial'),
        ('shows', '0004_migrate_seasons_to_shows'),
    ]

    operations = [
        migrations.RemoveField(model_name='question', name='season'),
        migrations.RemoveField(model_name='knowledgefile', name='season'),
        migrations.AlterField(
            model_name='question',
            name='show',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='questions', to='shows.show'),
        ),
        migrations.AlterField(
            model_name='knowledgefile',
            name='show',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='knowledge_files', to='shows.show'),
        ),
    ]
