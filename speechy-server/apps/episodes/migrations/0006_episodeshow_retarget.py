from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('episodes', '0005_episodesummary_brief_summary_and_more'),
        ('shows', '0004_migrate_seasons_to_shows'),
    ]

    operations = [
        # Retarget the through-table's FK from Season to Show. Values are unchanged —
        # every id it references now also exists as a row in shows_show (migrated in
        # shows.0004), so this is a schema-only change, not a data migration.
        migrations.AlterField(
            model_name='episodeseason',
            name='season',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='shows.show'),
        ),
        migrations.RenameField(model_name='episodeseason', old_name='season', new_name='show'),
        migrations.AlterUniqueTogether(name='episodeseason', unique_together={('episode', 'show')}),
        migrations.AlterModelOptions(name='episodeseason', options={'ordering': ['show', 'episode_order']}),
        migrations.RenameModel(old_name='EpisodeSeason', new_name='EpisodeShow'),
        # Episode.seasons (M2M to Season) -> Episode.shows (M2M to Show). The through
        # table (EpisodeShow, just retargeted above) already holds the real data — these
        # M2M field ops are schema/state bookkeeping only, no table is created/dropped.
        migrations.RemoveField(model_name='episode', name='seasons'),
        migrations.AddField(
            model_name='episode',
            name='shows',
            field=models.ManyToManyField(
                related_name='cross_listed_episodes', through='episodes.EpisodeShow', to='shows.show',
            ),
        ),
    ]
