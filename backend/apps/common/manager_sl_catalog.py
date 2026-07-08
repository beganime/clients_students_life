from decimal import Decimal, InvalidOperation

from rest_framework.response import Response

from .manager_sl import ManagerSLClient, ManagerSLClientError, ManagerSLConfigError


def manager_sl_error_response(exc):
    status_code = getattr(exc, 'status_code', 502)
    return Response(
        {
            'detail': 'Catalog data is temporarily unavailable.',
        },
        status=status_code if 400 <= status_code < 600 else 502,
    )


def map_paginated(payload, mapper):
    if isinstance(payload, dict) and isinstance(payload.get('results'), list):
        mapped = payload.copy()
        mapped['results'] = [mapper(item) for item in payload['results']]
        return mapped
    if isinstance(payload, list):
        return {
            'count': len(payload),
            'next': None,
            'previous': None,
            'results': [mapper(item) for item in payload],
        }
    return payload


def first_fee(program):
    fees = program.get('fees') or []
    return fees[0] if fees else {}


def money_text(value, currency='', symbol=''):
    if value in (None, ''):
        return ''
    try:
        amount = Decimal(str(value))
        value = str(amount.quantize(Decimal('1')) if amount == amount.to_integral() else amount)
    except (InvalidOperation, ValueError):
        value = str(value)
    suffix = symbol or currency
    return f'{value} {suffix}'.strip()


def map_country(item):
    country_id = item.get('id')
    return {
        'id': country_id,
        'name': item.get('name') or '',
        'slug': str(country_id),
        'flag': item.get('flag_url') or item.get('flag'),
        'cover_image': item.get('cover_image_url') or item.get('image_url'),
        'short_description': item.get('description') or '',
        'description_markdown': item.get('description') or '',
        'average_tuition': '',
        'average_living_cost': '',
        'cities_count': item.get('cities_count') or item.get('city_count') or 0,
        'universities_count': item.get('universities_count') or item.get('university_count') or 0,
        'sort_order': 0,
    }


def map_city(item):
    city_id = item.get('id')
    country_id = item.get('country')
    return {
        'id': city_id,
        'country': country_id,
        'country_name': item.get('country_name') or '',
        'country_slug': str(country_id) if country_id else '',
        'name': item.get('name') or '',
        'slug': str(city_id),
        'image': item.get('cover_image_url') or item.get('image_url'),
        'cover_image': item.get('cover_image_url') or item.get('image_url'),
        'description_markdown': item.get('description') or '',
        'rent_cost': '',
        'food_cost': '',
        'transport_cost': '',
        'total_monthly_cost': '',
        'universities_count': item.get('universities_count') or item.get('university_count') or 0,
        'sort_order': 0,
    }


def map_program(item):
    program_id = item.get('id')
    fee = first_fee(item)
    currency = fee.get('currency') or ''
    currency_symbol = fee.get('currency_symbol') or currency
    tuition = money_text(fee.get('tuition_fee'), currency=currency, symbol=currency_symbol)
    return {
        'id': program_id,
        'university': item.get('university'),
        'university_name': item.get('university_name') or '',
        'university_logo': item.get('university_logo_url') or item.get('logo_url') or item.get('logo'),
        'university_cover': item.get('university_cover_image_url') or item.get('cover_image_url') or item.get('cover'),
        'country_name': item.get('country') or item.get('country_name') or '',
        'city_name': item.get('city') or item.get('city_name') or '',
        'title': item.get('name') or item.get('title') or '',
        'level': item.get('degree_display') or item.get('degree') or '',
        'faculty': item.get('faculty') or '',
        'specialty': item.get('name') or '',
        'language': item.get('language') or '',
        'duration': item.get('duration') or '',
        'tuition_fee': tuition or None,
        'currency': currency,
        'application_deadline': '',
        'start_date': item.get('start_date') or item.get('intake') or '',
        'intakes': item.get('intakes') or item.get('start_date') or '',
        'required_documents': ', '.join(doc.get('title', '') for doc in item.get('required_documents') or [] if doc.get('title')),
        'documents': ', '.join(doc.get('title', '') for doc in item.get('required_documents') or [] if doc.get('title')),
        'requirements': item.get('admission_requirements') or '',
        'description_markdown': item.get('description') or item.get('admission_requirements') or '',
        'sort_order': 0,
    }


def map_university(item):
    university_id = item.get('id')
    programs = [map_program(program) for program in item.get('programs') or []]
    fees_summary = item.get('fees_summary') or []
    first_summary = fees_summary[0] if fees_summary else {}
    tuition_from = money_text(
        first_summary.get('tuition_fee'),
        currency=first_summary.get('currency') or '',
        symbol=first_summary.get('currency_symbol') or '',
    )
    dormitory_info = item.get('dormitory_info') or ''
    return {
        'id': university_id,
        'name': item.get('name') or '',
        'slug': str(university_id),
        'country': item.get('country'),
        'country_name': item.get('country_name') or '',
        'country_slug': str(item.get('country')) if item.get('country') else '',
        'city': item.get('city'),
        'city_name': item.get('city_name') or '',
        'city_slug': str(item.get('city')) if item.get('city') else '',
        'logo': item.get('logo_url') or item.get('logo'),
        'cover_image': item.get('cover_image_url') or item.get('cover'),
        'description_markdown': item.get('description') or '',
        'university_type': '',
        'partner_status': False,
        'recognized_status': True,
        'official_website': item.get('website') or '',
        'languages': ', '.join(sorted({p.get('language') for p in programs if p.get('language')})),
        'education_levels': ', '.join(sorted({p.get('level') for p in programs if p.get('level')})),
        'has_dormitory': bool(dormitory_info),
        'dormitory_cost': dormitory_info,
        'scholarship_available': False,
        'tuition_from': tuition_from,
        'application_deadline': '',
        'required_documents': ', '.join(doc.get('title', '') for doc in item.get('required_documents') or [] if doc.get('title')),
        'admission_requirements': item.get('admission_requirements') or item.get('required_documents_text') or '',
        'dormitory_info': dormitory_info,
        'expenses_info': tuition_from,
        'public_contacts': item.get('contacts') or item.get('website') or '',
        'contacts': item.get('contacts') or ({'website': item.get('website')} if item.get('website') else {}),
        'contact_people': item.get('contact_people') or [],
        'programs_count': item.get('programs_count') or len(programs),
        'programs': programs,
        'sort_order': 0,
        'is_favorite': False,
    }


def map_service(item):
    service_id = item.get('id')
    price = money_text(
        item.get('price_client'),
        currency=item.get('currency') or '',
        symbol=item.get('currency_symbol') or '',
    )
    description = item.get('description') or ''
    return {
        'id': service_id,
        'title': item.get('title') or '',
        'slug': str(service_id),
        'short_description': description[:220],
        'description_markdown': description,
        'icon': None,
        'cover_image': None,
        'required_documents': '',
        'estimated_time': '',
        'button_text': 'Оставить заявку',
        'meta_title': item.get('title') or '',
        'meta_description': description[:160],
        'sort_order': 0,
        'price': price,
    }


def proxy_manager_sl_resource(request, resource, mapper, pk=None, params=None):
    client = ManagerSLClient.from_settings()
    if not client.is_configured:
        return None
    try:
        payload = client.get_client_resource(resource, params=params or request.query_params, pk=pk)
    except (ManagerSLClientError, ManagerSLConfigError) as exc:
        if getattr(exc, 'status_code', 502) >= 500:
            return None
        return manager_sl_error_response(exc)
    if pk is not None and isinstance(payload, dict):
        return Response(mapper(payload))
    return Response(map_paginated(payload, mapper))
