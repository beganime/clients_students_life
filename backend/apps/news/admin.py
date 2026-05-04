from django.contrib import admin

from .models import NewsCategory, NewsPost


@admin.register(NewsCategory)
class NewsCategoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug')
    search_fields = ('title',)
    prepopulated_fields = {'slug': ('title',)}


@admin.register(NewsPost)
class NewsPostAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author_staff', 'status', 'is_important', 'send_push', 'published_at')
    list_filter = ('status', 'is_important', 'send_push', 'category', 'author_staff')
    search_fields = ('title', 'short_description', 'content_markdown')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'published_at'
    ordering = ('-published_at', '-created_at')