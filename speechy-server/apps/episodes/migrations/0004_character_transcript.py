import uuid
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('episodes', '0003_initial'),
    ]

    operations = [
        # 1. Create Character model
        migrations.CreateModel(
            name='Character',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('character_ref', models.CharField(db_index=True, max_length=100)),
                ('name', models.CharField(max_length=255)),
                ('actor', models.CharField(blank=True, max_length=255)),
            ],
            options={'ordering': ['name']},
        ),
        migrations.AddConstraint(
            model_name='character',
            constraint=models.UniqueConstraint(
                fields=['character_ref', 'actor'],
                name='unique_character_ref_actor',
            ),
        ),

        # 2. Remove raw_excel_path from Episode
        migrations.RemoveField(model_name='episode', name='raw_excel_path'),

        # 3. Remove featured_characters from Episode
        migrations.RemoveField(model_name='episode', name='featured_characters'),

        # 4. Add characters M2M to Episode
        migrations.AddField(
            model_name='episode',
            name='characters',
            field=models.ManyToManyField(
                blank=True,
                related_name='episodes',
                to='episodes.character',
            ),
        ),

        # 5. Create Transcript model
        migrations.CreateModel(
            name='Transcript',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('language', models.CharField(
                    choices=[('origin', 'Origin'), ('hebrew', 'Hebrew'), ('english', 'English')],
                    max_length=10,
                )),
                ('rows', models.JSONField(default=list)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('episode', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='transcripts',
                    to='episodes.episode',
                )),
            ],
            options={
                'ordering': ['episode', 'language'],
                'unique_together': {('episode', 'language')},
            },
        ),

        # 6. Drop EpisodeTranslation (superseded by Transcript)
        migrations.DeleteModel(name='EpisodeTranslation'),
    ]
