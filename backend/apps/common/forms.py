from django import forms

from .models import DeveloperRequest


class DeveloperRequestForm(forms.ModelForm):
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
