from django.contrib import admin

from .models import KnowledgeCategory, KnowledgeArticle


@admin.register(KnowledgeCategory)
class KnowledgeCategoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug')
    search_fields = ('title',)
    prepopulated_fields = {'slug': ('title',)}


@admin.register(KnowledgeArticle)
class KnowledgeArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author_staff', 'status', 'published_at')
    list_filter = ('status', 'category', 'author_staff')
    search_fields = ('title', 'short_description', 'content_markdown', 'tags')
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'published_at'
    ordering = ('-published_at', '-created_at')