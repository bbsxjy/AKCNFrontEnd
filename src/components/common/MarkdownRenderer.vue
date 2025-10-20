<template>
  <div class="markdown-renderer" v-html="renderedHtml"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

interface Props {
  content: string
  enableCodeHighlight?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enableCodeHighlight: true
})

// Initialize markdown-it with highlight.js integration
const md: MarkdownIt = new MarkdownIt({
  html: false, // Disable HTML for security
  breaks: true, // Convert \n to <br>
  linkify: true, // Auto-convert URLs to links
  typographer: true, // Enable smart quotes and other typographic features
  highlight: function (str, lang) {
    if (!props.enableCodeHighlight) return ''

    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' +
               hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
               '</code></pre>'
      } catch (__) {}
    }

    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>'
  }
})

const renderedHtml = computed(() => {
  if (!props.content) return ''
  return md.render(props.content)
})
</script>

<style scoped lang="scss">
.markdown-renderer {
  font-size: 14px;
  line-height: 1.7;
  color: #2d3748;

  // Headers
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    margin: 20px 0 10px;
    font-weight: 600;
    line-height: 1.4;
    color: #1a202c;

    &:first-child {
      margin-top: 0;
    }
  }

  :deep(h1) {
    font-size: 24px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
  }

  :deep(h2) {
    font-size: 20px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
  }

  :deep(h3) {
    font-size: 18px;
  }

  :deep(h4) {
    font-size: 16px;
  }

  // Paragraphs
  :deep(p) {
    margin: 12px 0;
    line-height: 1.7;
  }

  // Lists
  :deep(ul), :deep(ol) {
    margin: 12px 0;
    padding-left: 28px;

    li {
      margin: 6px 0;
      line-height: 1.6;
    }
  }

  :deep(ul) {
    list-style-type: disc;

    ul {
      list-style-type: circle;
    }
  }

  :deep(ol) {
    list-style-type: decimal;
  }

  // Emphasis
  :deep(strong) {
    font-weight: 600;
    color: #1a202c;
  }

  :deep(em) {
    font-style: italic;
  }

  // Inline code
  :deep(code) {
    padding: 2px 6px;
    margin: 0 2px;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 3px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
    color: #c7254e;
  }

  // Code blocks
  :deep(pre) {
    margin: 12px 0;
    padding: 12px;
    background: #2d3748;
    border-radius: 6px;
    overflow-x: auto;

    code {
      padding: 0;
      margin: 0;
      background: transparent;
      border: none;
      color: #e2e8f0;
      font-size: 13px;
      line-height: 1.5;
    }
  }

  // Links
  :deep(a) {
    color: #667eea;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: border-color 0.2s;

    &:hover {
      border-bottom-color: #667eea;
    }
  }

  // Blockquotes
  :deep(blockquote) {
    margin: 12px 0;
    padding: 10px 15px;
    border-left: 4px solid #667eea;
    background: #f7fafc;
    color: #4a5568;

    p {
      margin: 0;
    }
  }

  // Horizontal rules
  :deep(hr) {
    margin: 20px 0;
    border: none;
    border-top: 2px solid #e2e8f0;
  }

  // Tables
  :deep(table) {
    margin: 12px 0;
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #e2e8f0;

    th, td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }

    th {
      background: #f7fafc;
      font-weight: 600;
      color: #2d3748;
    }

    tr:nth-child(even) {
      background: #f7fafc;
    }
  }

  // Emoji support
  :deep(.emoji) {
    width: 1em;
    height: 1em;
    vertical-align: -0.1em;
  }

  // Task lists
  :deep(input[type="checkbox"]) {
    margin-right: 6px;
  }
}
</style>

<style lang="scss">
// Import highlight.js theme (GitHub style)
@import 'highlight.js/styles/github.css';
</style>
