#!/usr/bin/env python3
"""Token codemod: maps legacy slate/blue Tailwind class pairs to the
semantic design tokens defined in src/index.css. Order matters — longer,
more specific patterns run first."""
import re
import sys
import pathlib

REPLACEMENTS = [
    # ── Composite light+dark pairs (most specific first) ──────────────
    ("bg-white dark:bg-slate-950", "bg-surface"),
    ("bg-white dark:bg-slate-900", "bg-surface"),
    ("bg-slate-50 dark:bg-slate-950", "bg-surface-sunken"),
    ("bg-slate-50 dark:bg-slate-900", "bg-surface-sunken"),
    ("bg-slate-100 dark:bg-slate-900", "bg-surface-hover"),
    ("bg-slate-100 dark:bg-slate-800", "bg-surface-hover"),
    ("bg-slate-200 dark:bg-slate-800", "bg-surface-hover"),
    ("hover:bg-slate-50 dark:hover:bg-slate-900", "hover:bg-surface-hover"),
    ("hover:bg-slate-100 dark:hover:bg-slate-900", "hover:bg-surface-hover"),
    ("hover:bg-slate-100 dark:hover:bg-slate-800", "hover:bg-surface-hover"),
    ("hover:bg-slate-200 dark:hover:bg-slate-700", "hover:bg-surface-hover"),
    ("border-slate-200 dark:border-slate-800", "border-line"),
    ("border-slate-200 dark:border-slate-700", "border-line"),
    ("border-slate-300 dark:border-slate-700", "border-line-strong"),
    ("border-slate-300 dark:border-slate-600", "border-line-strong"),
    ("divide-slate-200 dark:divide-slate-800", "divide-line"),
    ("text-slate-900 dark:text-slate-100", "text-content"),
    ("text-slate-900 dark:text-white", "text-content"),
    ("text-slate-800 dark:text-slate-100", "text-content"),
    ("text-slate-800 dark:text-slate-200", "text-content"),
    ("text-slate-700 dark:text-slate-200", "text-content-secondary"),
    ("text-slate-700 dark:text-slate-300", "text-content-secondary"),
    ("text-slate-600 dark:text-slate-300", "text-content-secondary"),
    ("text-slate-600 dark:text-slate-400", "text-content-secondary"),
    ("text-slate-500 dark:text-slate-400", "text-content-tertiary"),
    ("text-slate-500 dark:text-slate-500", "text-content-tertiary"),
    ("text-slate-400 dark:text-slate-500", "text-content-tertiary"),
    ("text-slate-400 dark:text-slate-600", "text-content-tertiary"),
    ("hover:text-slate-700 dark:hover:text-slate-200", "hover:text-content"),
    ("hover:text-slate-900 dark:hover:text-slate-100", "hover:text-content"),
    ("hover:text-slate-900 dark:hover:text-white", "hover:text-content"),
    ("hover:text-slate-600 dark:hover:text-slate-300", "hover:text-content-secondary"),
    ("placeholder:text-slate-400 dark:placeholder:text-slate-500", "placeholder:text-content-tertiary"),
    ("placeholder:text-slate-500 dark:placeholder:text-slate-500", "placeholder:text-content-tertiary"),
    # Primary button combos
    ("bg-blue-600 hover:bg-blue-700 text-white", "bg-primary hover:bg-primary-hover text-primary-content"),
    ("bg-blue-600 text-white hover:bg-blue-700", "bg-primary text-primary-content hover:bg-primary-hover"),
    ("bg-blue-600 hover:bg-blue-700", "bg-primary hover:bg-primary-hover"),
    ("bg-blue-500 hover:bg-blue-600", "bg-primary hover:bg-primary-hover"),
    ("text-blue-600 dark:text-blue-400", "text-primary"),
    ("text-blue-600 dark:text-[#579DFF]", "text-primary"),
    ("text-blue-700 dark:text-[#85B8FF]", "text-primary"),
    ("hover:text-blue-600 dark:hover:text-[#579DFF]", "hover:text-primary"),
    ("hover:text-blue-700 dark:hover:text-blue-300", "hover:text-primary-hover"),
    ("bg-blue-50 dark:bg-blue-950/40", "bg-primary-subtle"),
    ("bg-blue-50 dark:bg-blue-950/50", "bg-primary-subtle"),
    ("bg-blue-100 dark:bg-blue-950", "bg-primary-subtle"),
    ("focus:ring-blue-500 focus:border-blue-500", "focus:ring-primary/30 focus:border-line-focus"),
    ("focus:border-blue-500 focus:ring-blue-500", "focus:border-line-focus focus:ring-primary/30"),
    ("focus:ring-2 focus:ring-blue-500", "focus:ring-2 focus:ring-primary/30"),
    ("ring-blue-500", "ring-primary"),
    ("border-blue-500", "border-primary"),
    ("border-blue-600", "border-primary"),
    # Danger combos
    ("bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-200",
     "bg-danger/[0.06] border border-danger/25 text-danger text-sm px-4 py-3 rounded-lg"),
    ("text-red-600 dark:text-red-400", "text-danger"),
    ("text-red-500 dark:text-red-400", "text-danger"),
    ("hover:text-red-600 dark:hover:text-red-400", "hover:text-danger"),
    ("hover:bg-red-50 dark:hover:bg-red-950/30", "hover:bg-danger/10"),
    ("hover:bg-red-50 dark:hover:bg-red-950/20", "hover:bg-danger/10"),
    ("bg-red-50 dark:bg-red-950/40", "bg-danger/10"),
    ("bg-red-50 dark:bg-red-950/30", "bg-danger/10"),
    ("border-red-200 dark:border-red-900/60", "border-danger/25"),
    ("border-red-200 dark:border-red-900", "border-danger/25"),
    ("border-red-200 dark:border-red-800", "border-danger/25"),
    ("text-red-700 dark:text-red-200", "text-danger"),
    ("text-red-700 dark:text-red-300", "text-danger"),
    # Success combos
    ("bg-emerald-50 dark:bg-emerald-950/40", "bg-success/10"),
    ("bg-emerald-50 dark:bg-emerald-950/30", "bg-success/10"),
    ("text-emerald-600 dark:text-emerald-400", "text-success"),
    ("text-emerald-700 dark:text-emerald-300", "text-success"),
    ("border-emerald-200 dark:border-emerald-800", "border-success/25"),
    # Ring offsets / misc
    ("ring-offset-white dark:ring-offset-slate-950", "ring-offset-surface"),
    ("ring-offset-white dark:ring-offset-slate-900", "ring-offset-surface"),
    ("dark:focus:ring-offset-slate-950", ""),
    ("dark:focus:ring-offset-slate-900", ""),
]

# ── Solo fallbacks: light-only classes with no dark pair left after
#    the composite pass. Applied cautiously (word-boundary match). ──
SOLO = [
    ("bg-slate-900/50", "bg-black/45"),
    ("bg-slate-900/60", "bg-black/45"),
]


def process(path: pathlib.Path) -> int:
    s = path.read_text()
    orig = s
    for old, new in REPLACEMENTS:
        s = s.replace(old, new)
    for old, new in SOLO:
        s = s.replace(old, new)
    # Collapse doubled spaces inside className strings caused by empty replacements
    s = re.sub(r'(className="[^"]*)  +', lambda m: re.sub(r"  +", " ", m.group(0)), s)
    if s != orig:
        path.write_text(s)
        return 1
    return 0


if __name__ == "__main__":
    changed = 0
    for arg in sys.argv[1:]:
        p = pathlib.Path(arg)
        if p.is_file():
            changed += process(p)
    print(f"changed {changed} files")

# ── Extended pass: singles + dark-variant drop (used by tokenize_full) ──
SINGLE_MAP = {
  'text-slate-900': 'text-content', 'text-slate-800': 'text-content',
  'text-slate-700': 'text-content-secondary', 'text-slate-600': 'text-content-secondary',
  'text-slate-500': 'text-content-tertiary', 'text-slate-400': 'text-content-tertiary',
  'text-slate-300': 'text-content-tertiary',
  'hover:text-slate-900': 'hover:text-content', 'hover:text-slate-800': 'hover:text-content',
  'hover:text-slate-700': 'hover:text-content', 'hover:text-slate-600': 'hover:text-content',
  'placeholder:text-slate-500': 'placeholder:text-content-tertiary',
  'placeholder:text-slate-400': 'placeholder:text-content-tertiary',
  'border-slate-100': 'border-line', 'border-slate-200': 'border-line',
  'border-slate-300': 'border-line-strong',
  'divide-slate-100': 'divide-line', 'divide-slate-200': 'divide-line',
  'bg-slate-50': 'bg-surface-sunken', 'bg-slate-100': 'bg-surface-hover', 'bg-slate-200': 'bg-surface-hover',
  'hover:bg-slate-50': 'hover:bg-surface-hover', 'hover:bg-slate-100': 'hover:bg-surface-hover',
  'hover:bg-slate-200': 'hover:bg-surface-hover',
  'bg-white': 'bg-surface',
  'bg-slate-950/60': 'bg-black/45', 'bg-slate-950/50': 'bg-black/45',
  'bg-slate-900/50': 'bg-black/45', 'bg-slate-900/60': 'bg-black/45',
  'bg-blue-600': 'bg-primary', 'bg-blue-500': 'bg-primary',
  'hover:bg-blue-700': 'hover:bg-primary-hover', 'hover:bg-blue-600': 'hover:bg-primary-hover',
  'text-blue-600': 'text-primary', 'text-blue-700': 'text-primary', 'text-blue-500': 'text-primary',
  'hover:text-blue-600': 'hover:text-primary', 'hover:text-blue-700': 'hover:text-primary-hover',
  'hover:text-blue-800': 'hover:text-primary-hover',
  'bg-blue-50': 'bg-primary-subtle', 'bg-blue-100': 'bg-primary-subtle',
  'hover:bg-blue-50': 'hover:bg-primary-subtle', 'hover:bg-blue-100': 'hover:bg-primary-subtle',
  'shadow-blue-600/20': '', 'shadow-blue-500/20': '', 'shadow-blue-500/30': '',
  'text-red-700': 'text-danger', 'text-red-600': 'text-danger', 'text-red-500': 'text-danger',
  'hover:text-red-600': 'hover:text-danger', 'hover:text-red-500': 'hover:text-danger',
  'hover:text-red-700': 'hover:text-danger',
  'bg-red-50': 'bg-danger/10', 'hover:bg-red-50': 'hover:bg-danger/10', 'hover:bg-red-100': 'hover:bg-danger/15',
  'bg-red-600': 'bg-danger', 'hover:bg-red-700': 'hover:bg-danger/90', 'bg-red-500': 'bg-danger',
  'hover:bg-red-600': 'hover:bg-danger/90',
  'border-red-200': 'border-danger/25', 'border-red-300': 'border-danger/30',
  'focus:ring-red-400': 'focus:ring-danger/40',
  'text-emerald-700': 'text-success', 'text-emerald-600': 'text-success', 'text-emerald-500': 'text-success',
  'text-green-600': 'text-success', 'text-green-700': 'text-success',
  'bg-emerald-50': 'bg-success/10', 'border-emerald-200': 'border-success/25',
  'bg-green-50': 'bg-success/10', 'border-green-200': 'border-success/25',
  'bg-emerald-600': 'bg-success', 'hover:bg-emerald-700': 'hover:bg-success/90',
  'text-amber-900': 'text-warning', 'text-amber-700': 'text-warning', 'text-amber-600': 'text-warning',
  'text-amber-500': 'text-warning',
  'bg-amber-50': 'bg-warning/10', 'border-amber-200': 'border-warning/25',
  'ring-offset-white': 'ring-offset-surface',
  'ring-blue-500': 'ring-primary', 'border-blue-500': 'border-primary', 'border-blue-600': 'border-primary',
  'focus:border-blue-500': 'focus:border-line-focus', 'focus:ring-blue-500': 'focus:ring-primary/30',
  'focus:ring-blue-100': 'focus:ring-primary/20',
}

DARK_DROP_RE = re.compile(r'\s?\bdark:[a-z:\-]*-(?:slate|gray|blue|red|emerald|green|amber|indigo)-[0-9]{2,3}(?:/[0-9]+)?\b')
SINGLE_RE = re.compile(r'(?<![\w:/\[-])(' + '|'.join(re.escape(k) for k in sorted(SINGLE_MAP, key=len, reverse=True)) + r')(?![\w/-])')


def fix_primary_contrast(s: str) -> str:
    def fix(m):
        cls = m.group(0)
        if 'bg-primary' in cls and 'text-white' in cls and 'bg-primary-subtle' not in cls and 'bg-primary/' not in cls:
            cls = cls.replace('text-white', 'text-primary-content')
        return cls
    s = re.sub(r'className="[^"]*"', fix, s)
    s = re.sub(r'className=\{`[^`]*`\}', fix, s, flags=re.S)
    return s


def process_full(path: pathlib.Path) -> int:
    s = path.read_text()
    orig = s
    for old, new in REPLACEMENTS:
        s = s.replace(old, new)
    s = SINGLE_RE.sub(lambda m: SINGLE_MAP[m.group(1)], s)
    s = DARK_DROP_RE.sub('', s)
    s = fix_primary_contrast(s)
    s = re.sub(r'className="([^"]*?)\s{2,}([^"]*?)"', lambda m: 'className="' + re.sub(r'\s{2,}', ' ', m.group(1) + ' ' + m.group(2)).strip() + '"', s)
    s = re.sub(r'className="([^"]*?)\s+"', lambda m: f'className="{m.group(1)}"', s)
    if s != orig:
        path.write_text(s)
        return 1
    return 0
