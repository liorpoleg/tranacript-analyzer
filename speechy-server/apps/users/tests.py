import hashlib
from django.test import TestCase
from django.utils import timezone

from apps.users.models import Organization, User, APIKey, UserSession, AuditLog, Role
from apps.users.services import (
    login_user, create_session, create_api_key, revoke_api_key, log_action,
)


def make_org(slug='test-org'):
    return Organization.objects.create(name='Test Org', slug=slug)


def make_user(org, username='testuser', email='test@example.com', password='testpass123'):
    return User.objects.create_user(
        username=username, email=email, password=password, organization=org
    )


class OrganizationModelTest(TestCase):
    def test_str(self):
        org = make_org()
        self.assertEqual(str(org), 'Test Org')

    def test_default_limits(self):
        org = make_org()
        self.assertEqual(org.max_episodes, 100)
        self.assertEqual(org.max_users, 20)
        self.assertEqual(org.max_storage_mb, 10000)

    def test_uuid_pk(self):
        org = make_org()
        self.assertIsNotNone(org.id)
        self.assertEqual(len(str(org.id)), 36)


class UserModelTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)

    def test_str(self):
        self.assertEqual(str(self.user), 'testuser')

    def test_is_active_default_true(self):
        self.assertTrue(self.user.is_active)

    def test_default_role_is_analyst(self):
        self.assertEqual(self.user.role, Role.ANALYST)

    def test_password_is_hashed(self):
        self.assertFalse(self.user.password.startswith('testpass'))

    def test_check_password(self):
        self.assertTrue(self.user.check_password('testpass123'))
        self.assertFalse(self.user.check_password('wrong'))


class APIKeyModelTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)

    def test_generate_returns_raw_prefix_hash(self):
        raw, prefix, key_hash = APIKey.generate()
        self.assertEqual(len(prefix), 8)
        self.assertEqual(raw[:8], prefix)
        self.assertEqual(len(key_hash), 64)

    def test_generate_raw_matches_hash(self):
        raw, _, key_hash = APIKey.generate()
        expected = hashlib.sha256(raw.encode()).hexdigest()
        self.assertEqual(key_hash, expected)

    def test_is_active_when_not_revoked(self):
        key = APIKey.objects.create(
            user=self.user, name='test', key_prefix='abcdefgh', key_hash='x' * 64
        )
        self.assertTrue(key.is_active)

    def test_is_not_active_when_revoked(self):
        key = APIKey.objects.create(
            user=self.user, name='test', key_prefix='abcdefgh', key_hash='x' * 64,
            revoked_at=timezone.now()
        )
        self.assertFalse(key.is_active)

    def test_str_includes_name_and_prefix(self):
        key = APIKey.objects.create(
            user=self.user, name='My Key', key_prefix='abcdefgh', key_hash='x' * 64
        )
        s = str(key)
        self.assertIn('My Key', s)
        self.assertIn('abcdefgh', s)


class LoginUserServiceTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)

    def test_valid_credentials_returns_user_and_token(self):
        user, refresh = login_user('testuser', 'testpass123')
        self.assertEqual(user, self.user)
        self.assertIsNotNone(refresh)

    def test_wrong_password_returns_none(self):
        user, refresh = login_user('testuser', 'wrongpassword')
        self.assertIsNone(user)
        self.assertIsNone(refresh)

    def test_nonexistent_user_returns_none(self):
        user, refresh = login_user('nouser', 'testpass123')
        self.assertIsNone(user)
        self.assertIsNone(refresh)

    def test_inactive_user_returns_none(self):
        self.user.is_active = False
        self.user.save()
        user, refresh = login_user('testuser', 'testpass123')
        self.assertIsNone(user)


class CreateApiKeyServiceTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)

    def test_creates_api_key_record(self):
        api_key, raw = create_api_key(self.user, 'My Key')
        self.assertIsNotNone(api_key.pk)
        self.assertEqual(api_key.name, 'My Key')
        self.assertTrue(api_key.is_active)

    def test_raw_prefix_matches_record(self):
        api_key, raw = create_api_key(self.user, 'Key')
        self.assertEqual(raw[:8], api_key.key_prefix)

    def test_raw_key_hashes_correctly(self):
        api_key, raw = create_api_key(self.user, 'Key')
        expected = hashlib.sha256(raw.encode()).hexdigest()
        self.assertEqual(api_key.key_hash, expected)


class RevokeApiKeyServiceTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)
        self.api_key, _ = create_api_key(self.user, 'Key')

    def test_revoke_sets_revoked_at(self):
        self.assertTrue(self.api_key.is_active)
        revoke_api_key(self.api_key)
        self.api_key.refresh_from_db()
        self.assertFalse(self.api_key.is_active)
        self.assertIsNotNone(self.api_key.revoked_at)


class LogActionServiceTest(TestCase):
    def setUp(self):
        self.org = make_org()
        self.user = make_user(self.org)

    def test_creates_audit_log_record(self):
        log_action(self.user, 'create', 'show', 'some-id', {'name': 'My Show'})
        log = AuditLog.objects.filter(user=self.user, action='create').first()
        self.assertIsNotNone(log)
        self.assertEqual(log.resource_type, 'show')
        self.assertEqual(log.resource_id, 'some-id')
        self.assertEqual(log.details, {'name': 'My Show'})
        self.assertEqual(log.organization, self.org)

    def test_details_defaults_to_empty_dict(self):
        log_action(self.user, 'delete', 'episode', 'ep-1')
        log = AuditLog.objects.filter(action='delete').first()
        self.assertEqual(log.details, {})
