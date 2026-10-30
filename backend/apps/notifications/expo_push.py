"""Expo gateway for iOS; acceptance is not proof of delivery to a device."""
import logging
import os
import requests

logger = logging.getLogger(__name__)


def is_expo_token(token):
    return token.startswith(('ExponentPushToken[', 'ExpoPushToken[')) and token.endswith(']')


def send_expo(token, title, body, data=None):
    headers = {'Accept': 'application/json'}
    if os.environ.get('EXPO_ACCESS_TOKEN'):
        headers['Authorization'] = 'Bearer ' + os.environ['EXPO_ACCESS_TOKEN']
    response = requests.post('https://exp.host/--/api/v2/push/send',
        json={'to': token, 'title': title, 'body': body, 'sound': 'default', 'data': data or {}},
        headers=headers, timeout=(5, 15))
    response.raise_for_status()
    ticket = response.json().get('data', {})
    if isinstance(ticket, list):
        ticket = ticket[0] if ticket else {}
    if ticket.get('status') == 'ok':
        logger.info('Expo accepted push ticket %s; device delivery not yet verified', ticket.get('id', ''))
        return True, False
    error = ticket.get('details', {}).get('error', 'unknown')
    logger.warning('Expo push rejected: %s', error)
    return False, error == 'DeviceNotRegistered'
