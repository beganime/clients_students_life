from apps.accounts.manager_sl_sync import build_mobile_client_payload, compact
from apps.common.manager_sl import ManagerSLClient, ManagerSLClientError, ManagerSLConfigError


def file_url(file_field, request=None):
    if not file_field:
        return ''
    try:
        url = file_field.url
    except ValueError:
        return ''
    return request.build_absolute_uri(url) if request else url


def build_questionnaire_payload(questionnaire, request=None):
    return {
        'client': build_mobile_client_payload(questionnaire.user),
        'mobile_user_id': questionnaire.user_id,
        'mobile_questionnaire_id': questionnaire.id,
        'status': questionnaire.status,
        'full_name': compact(questionnaire.full_name, 255),
        'birth_date': questionnaire.birth_date.isoformat() if questionnaire.birth_date else '',
        'gender': questionnaire.gender,
        'citizenship': compact(questionnaire.citizenship, 120),
        'marital_status': compact(questionnaire.marital_status, 120),
        'face_photo_url': file_url(questionnaire.face_photo, request=request),
        'residence_country': compact(questionnaire.residence_country, 120),
        'residence_region': compact(questionnaire.residence_region, 160),
        'residence_city': compact(questionnaire.residence_city, 160),
        'residence_street': compact(questionnaire.residence_street, 180),
        'residence_house': compact(questionnaire.residence_house, 80),
        'residence_postal_code': compact(questionnaire.residence_postal_code, 40),
        'passport_number': compact(questionnaire.passport_number, 120),
        'passport_issued_by': compact(questionnaire.passport_issued_by, 255),
        'passport_issue_date': questionnaire.passport_issue_date.isoformat() if questionnaire.passport_issue_date else '',
        'passport_expiry_date': questionnaire.passport_expiry_date.isoformat() if questionnaire.passport_expiry_date else '',
        'phone': compact(questionnaire.phone, 80),
        'email': compact(questionnaire.email, 255),
        'extra_phone': compact(questionnaire.extra_phone, 80),
        'imo': compact(questionnaire.imo, 120),
        'telegram': compact(questionnaire.telegram, 120),
        'preferred_contact_method': questionnaire.preferred_contact_method,
        'parent_full_name': compact(questionnaire.parent_full_name, 255),
        'parent_relation': compact(questionnaire.parent_relation, 120),
        'parent_contacts': compact(questionnaire.parent_contacts, 180),
        'parent_workplace': compact(questionnaire.parent_workplace, 255),
        'family_members': compact(questionnaire.family_members, 120),
        'education_level': compact(questionnaire.education_level, 120),
        'school_class': compact(questionnaire.school_class, 40),
        'school_name': compact(questionnaire.school_name, 255),
        'school_country': compact(questionnaire.school_country, 120),
        'school_city': compact(questionnaire.school_city, 120),
        'graduation_year': compact(questionnaire.graduation_year, 20),
        'education_status': compact(questionnaire.education_status, 80),
        'achievements': questionnaire.achievements or [],
        'languages': questionnaire.languages or [],
        'desired_program': compact(questionnaire.desired_program, 255),
        'admission_goal': questionnaire.admission_goal,
        'desired_city': compact(questionnaire.desired_city, 120),
        'desired_country': compact(questionnaire.desired_country, 120),
        'desired_language': compact(questionnaire.desired_language, 120),
        'desired_education_level': compact(questionnaire.desired_education_level, 120),
        'admission_urgency': compact(questionnaire.admission_urgency, 80),
        'help_needed': questionnaire.help_needed or [],
        'has_visa': compact(questionnaire.has_visa, 60),
        'visa_country': compact(questionnaire.visa_country, 120),
        'visa_city': compact(questionnaire.visa_city, 120),
        'visa_valid_until': questionnaire.visa_valid_until.isoformat() if questionnaire.visa_valid_until else '',
        'has_international_passport': compact(questionnaire.has_international_passport, 80),
        'hobbies': questionnaire.hobbies,
        'applicant_comment': questionnaire.applicant_comment,
        'referral_source': compact(questionnaire.referral_source, 120),
        'data_processing_consent': questionnaire.data_processing_consent,
        'submitted_at': questionnaire.submitted_at.isoformat() if questionnaire.submitted_at else '',
        'attachments': [
            {
                'id': attachment.id,
                'original_name': compact(attachment.original_name, 255),
                'file_type': compact(attachment.file_type, 100),
                'file_url': file_url(attachment.file, request=request),
            }
            for attachment in questionnaire.attachments.all()
        ],
        'source': 'students_life_mobile_app',
    }


def sync_questionnaire_to_manager_sl(questionnaire, request=None):
    client = ManagerSLClient.from_settings()
    if not client.is_configured:
        questionnaire.manager_sl_sync_status = 'failed'
        questionnaire.manager_sl_sync_error = 'MANAGER_SL_API_BASE_URL is not configured.'
        questionnaire.save(update_fields=['manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
        return questionnaire

    try:
        response = client.request_json(
            'POST',
            'mobile/questionnaires/sync/',
            payload=build_questionnaire_payload(questionnaire, request=request),
            require_api_key=True,
        )
    except (ManagerSLClientError, ManagerSLConfigError) as exc:
        questionnaire.manager_sl_sync_status = 'failed'
        questionnaire.manager_sl_sync_error = compact(str(exc), 1000)
        questionnaire.save(update_fields=['manager_sl_sync_status', 'manager_sl_sync_error', 'updated_at'])
        return questionnaire

    questionnaire.manager_sl_questionnaire_id = compact(response.get('id') or '', 100)
    questionnaire.manager_sl_document_url = compact(response.get('generated_document_url') or '', 1000)
    questionnaire.manager_sl_sync_status = 'synced'
    questionnaire.manager_sl_sync_error = ''
    questionnaire.save(update_fields=[
        'manager_sl_questionnaire_id',
        'manager_sl_document_url',
        'manager_sl_sync_status',
        'manager_sl_sync_error',
        'updated_at',
    ])
    return questionnaire
