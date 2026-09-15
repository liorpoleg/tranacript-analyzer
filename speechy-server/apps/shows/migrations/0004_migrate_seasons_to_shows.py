from django.db import migrations
from django.db.migrations.exceptions import IrreversibleError
from django.db.models import F


def forwards(apps, schema_editor):
    Season = apps.get_model('shows', 'Season')
    Show = apps.get_model('shows', 'Show')
    KnowledgeFile = apps.get_model('knowledge', 'KnowledgeFile')
    Question = apps.get_model('knowledge', 'Question')

    for season in Season.objects.all():
        Show.objects.create(
            id=season.id,
            organization_id=season.show.organization_id,
            parent_id=season.show_id,
            name=season.title or f'Season {season.number}',
            description='',
            is_active=True,
            created_at=season.created_at,
            updated_at=season.created_at,
        )

    KnowledgeFile.objects.filter(season__isnull=False).update(show_id=F('season_id'))
    Question.objects.filter(season__isnull=False).update(show_id=F('season_id'))


def backwards(apps, schema_editor):
    # Unreachable in practice: shows.0005 raises IrreversibleError on its own
    # reverse (the first step Django attempts when unwinding this app), so a
    # `migrate` reverse never gets this far. Kept raising here too as a second
    # line of defense — this function cannot correctly undo the migration
    # anyway, since by the time it would run, knowledge.0003's auto-reverse has
    # already wiped the season_id values this needs to restore show_id=None
    # correctly. See shows.0005 for the full explanation and the real rollback
    # path (restore the Phase 0 pg_dump).
    raise IrreversibleError(
        'Cannot reverse: restore the pre-migration pg_dump snapshot instead.'
    )


class Migration(migrations.Migration):

    dependencies = [
        ('shows', '0003_show_parent'),
        ('knowledge', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
