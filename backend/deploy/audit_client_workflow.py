"""Read-only production audit for the latest provisioned mobile account."""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

import django

django.setup()

from django.contrib.auth import get_user_model

from apps.notifications.models import DeviceToken, UserNotification


def main():
    User = get_user_model()
    credential = (
        UserNotification.objects.filter(notification_type="account_credentials")
        .select_related("user")
        .order_by("-updated_at", "-created_at")
        .first()
    )
    print(f"users={User.objects.count()}")
    print(
        "credential_notifications="
        f"{UserNotification.objects.filter(notification_type='account_credentials').count()}"
    )
    if credential is None:
        print("latest_account=missing")
        raise SystemExit(1)

    user = credential.user
    questionnaire = getattr(user, "applicant_questionnaire", None)
    print(f"latest_account={user.username}")
    print(f"latest_account_active={user.is_active}")
    print(f"active_device_tokens={DeviceToken.objects.filter(user=user, is_active=True).count()}")
    print(f"credential_notification_unread={not credential.is_read}")
    print(f"questionnaire_exists={questionnaire is not None}")
    print(f"applications={user.applications.count()}")
    print("CLIENT_WORKFLOW_OK")


if __name__ == "__main__":
    main()
