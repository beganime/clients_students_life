from django import forms

from .models import DeveloperRequest


class DeveloperRequestForm(forms.ModelForm):
    TURKMEN_PROJECT_CHOICES = (
        ('website', 'Web sahypa'),
        ('mobile_app', 'Mobil programma'),
        ('crm_erp', 'CRM / ERP / HRM'),
        ('bot_integration', 'Telegram bot / Google Sheets'),
        ('server_deploy', 'Serwer / domen / ýerleşdiriş'),
        ('other', 'Başga'),
    )

    def __init__(self, *args, language='ru', **kwargs):
        super().__init__(*args, **kwargs)
        if language != 'tk':
            return

        self.fields['name'].widget.attrs['placeholder'] = 'Adyňyz ýa-da kompaniýanyň ady'
        self.fields['contact'].widget.attrs['placeholder'] = '@telegram, telefon ýa-da email'
        self.fields['contact_method'].choices = (
            ('telegram', 'Telegram'),
            ('phone', 'Telefon'),
            ('email', 'Email'),
        )
        self.fields['project_type'].choices = self.TURKMEN_PROJECT_CHOICES
        self.fields['budget'].widget.attrs['placeholder'] = 'Mysal: ylalaşyk boýunça'
        self.fields['timeline'].widget.attrs['placeholder'] = 'Mysal: gyssagly, 7 gün, 1 aý'
        self.fields['message'].widget.attrs['placeholder'] = (
            'Näme gerekdigini ýazyň: web sahypa, mobil programma, CRM, bot, integrasiýa, serwer...'
        )

    class Meta:
        model = DeveloperRequest
        fields = ('name', 'contact', 'contact_method', 'project_type', 'budget', 'timeline', 'message')
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Ваше имя или название компании'}),
            'contact': forms.TextInput(attrs={'placeholder': '@telegram, телефон или email'}),
            'contact_method': forms.Select(choices=(
                ('telegram', 'Telegram'),
                ('phone', 'Телефон'),
                ('email', 'Email'),
            )),
            'budget': forms.TextInput(attrs={'placeholder': 'Например: до 50 000 ₽, по договорённости'}),
            'timeline': forms.TextInput(attrs={'placeholder': 'Например: срочно, 2 недели, 1 месяц'}),
            'message': forms.Textarea(attrs={
                'placeholder': 'Опишите, что нужно сделать: сайт, мобильное приложение, CRM, бот, интеграции, сервер...',
                'rows': 6,
            }),
        }
