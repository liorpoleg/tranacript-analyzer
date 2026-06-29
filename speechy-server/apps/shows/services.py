from .models import Show, Season


def get_shows_for_user(user):
    return Show.objects.filter(organization=user.organization).select_related('organization')


def create_show(user, data: dict) -> Show:
    data.setdefault('organization', user.organization)
    return Show.objects.create(**data)


def create_season(show: Show, number: int, title: str = '') -> Season:
    return Season.objects.create(show=show, number=number, title=title)
