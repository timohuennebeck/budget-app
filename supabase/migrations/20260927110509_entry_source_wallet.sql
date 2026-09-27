-- Entries logged from an Apple Pay payment (Shortcuts "Transaction" automation).
alter type public.entry_source add value if not exists 'wallet';
