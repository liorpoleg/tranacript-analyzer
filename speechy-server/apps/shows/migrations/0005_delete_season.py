from django.db import migrations
from django.db.migrations.exceptions import IrreversibleError


def _forward_noop(apps, schema_editor):
    pass


def _refuse_reverse(apps, schema_editor):
    # DeleteModel's automatic reverse only recreates an empty Season table — it
    # cannot restore the rows DROP TABLE erased. Downstream, the auto-reverse of
    # episodes.0006 (retargeting EpisodeShow's FK back to Season) then fails with
    # a Postgres ForeignKeyViolation against that empty table (verified by hand).
    # This whole migration set is genuinely not reversible via `migrate <app>
    # <earlier>`. Raising here — as the LAST operation below, so it's the FIRST
    # one Django attempts on reverse — stops the attempt before any schema
    # change runs, instead of failing mid-way through a partially-reversed,
    # inconsistent DB. The real rollback is restoring the Phase 0 pg_dump.
    raise IrreversibleError(
        'This migration cannot be safely reversed: Season row data is '
        'permanently gone once this migration is applied (DeleteModel does '
        'not restore data on reverse). Restore the pre-migration pg_dump '
        'snapshot instead of trying to migrate backwards past this point.'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('shows', '0004_migrate_seasons_to_shows'),
        ('episodes', '0006_episodeshow_retarget'),
        ('knowledge', '0003_drop_season_require_show'),
    ]

    operations = [
        migrations.DeleteModel(name='Season'),
        migrations.RunPython(_forward_noop, reverse_code=_refuse_reverse),
    ]
