import glob
import re

files = [
    "apps/web/features/payments/screens/payments-screen.tsx",
    "apps/web/features/meetings/screens/meetings-screen.tsx",
    "apps/web/features/resources/screens/resources-screen.tsx",
    "apps/web/features/analytics/screens/analytics-screen.tsx",
    "apps/web/features/chat/screens/chat-screen.tsx",
    "apps/web/features/messages/screens/messages-screen.tsx"
]

header_pattern = re.compile(
    r'<header className="border-b px-6 py-6">\s*<div className="mx-auto max-w-\[1400px\]">\s*<h1 className="text-2xl font-semibold">([^<]+)</h1>\s*<p className="text-sm text-zinc-600">([^<]+)</p>\s*</div>\s*</header>',
    re.MULTILINE
)

def replace_header(match):
    title = match.group(1)
    subtitle = match.group(2)
    return f"""<header className="border-b border-emerald-950/15 bg-white px-6 py-8 dark:border-emerald-400/15 dark:bg-stone-950 sm:px-10 lg:px-14">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-stone-950 dark:text-stone-50">
              {title} <span className="font-semibold text-emerald-800 dark:text-emerald-300"></span>
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
              {subtitle}
            </p>
          </div>
        </div>
      </header>"""

for f in files:
    with open(f, 'r') as file:
        content = file.read()
    
    new_content = header_pattern.sub(replace_header, content)
    
    with open(f, 'w') as file:
        file.write(new_content)

print("Done formatting stubs.")
