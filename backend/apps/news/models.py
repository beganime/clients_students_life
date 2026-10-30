from django.db import models
from django.conf import settings
from django.utils import timezone
from django.utils.text import slugify

from apps.common.models import TimeStampedModel, SeoModel
from apps.staff.models import StaffProfile


class NewsCategory(TimeStampedModel):
    title = models.CharField('Название категории', max_length=255)
    slug = models.SlugField('Slug', max_length=255, unique=True, blank=True)

    class Meta:
        verbose_name = 'Категория новости'
        verbose_name_plural = 'Категории новостей'
        ordering = ['title']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title


class ClientForm(models.Model):
    title = models.CharField(max_length=255)
    description = models.CharField(max_length=1000, blank=True)
    form_url = models.URLField(max_length=2000)
    status = models.CharField(max_length=12, choices=[('draft', 'Черновик'), ('published', 'Опубликована'), ('closed', 'Скрыта')], default='draft')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ClientPoll(models.Model):
    question = models.CharField(max_length=255)
    options = models.JSONField(default=list)
    status = models.CharField(max_length=12, choices=[('draft', 'Черновик'), ('published', 'Опубликован'), ('closed', 'Закрыт')], default='draft')
    created_at = models.DateTimeField(auto_now_add=True)


class PollVote(models.Model):
    poll = models.ForeignKey(ClientPoll, on_delete=models.CASCADE, related_name='votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    choice = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['poll', 'user'], name='one_client_vote_per_poll')]


class NewsPost(TimeStampedModel, SeoModel):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Черновик'
        PUBLISHED = 'published', 'Опубликовано'
        HIDDEN = 'hidden', 'Скрыто'

    title = models.CharField('Заголовок', max_length=255)
    slug = models.SlugField('Slug', max_length=255, unique=True, blank=True)
    short_description = models.CharField('Краткое описание', max_length=500, blank=True)
    content_markdown = models.TextField('Текст Markdown', blank=True)
    cover_image = models.ImageField('Обложка', upload_to='news/covers/', blank=True, null=True)
    category = models.ForeignKey(
        NewsCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts',
        verbose_name='Категория'
    )
    author_staff = models.ForeignKey(
        StaffProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='news_posts',
        verbose_name='Автор'
    )
    status = models.CharField('Статус', max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_important = models.BooleanField('Важная новость', default=False)
    send_push = models.BooleanField('Отправить push', default=False)
    published_at = models.DateTimeField('Дата публикации', null=True, blank=True)

    class Meta:
        verbose_name = 'Новость'
        verbose_name_plural = 'Новости'
        ordering = ['-published_at', '-created_at']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title, allow_unicode=True)
        if self.status == self.Status.PUBLISHED and not self.published_at:
            self.published_at = timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title
