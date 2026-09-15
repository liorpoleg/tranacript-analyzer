from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('shows', '0002_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='show',
            name='parent',
            field=models.ForeignKey(
                blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                related_name='children', to='shows.show',
            ),
        ),
        migrations.AlterModelOptions(
            name='show',
            options={'ordering': ['created_at']},
        ),
    ]
