# Showdown Battle Log Interpretation

ChangeBattle treats Pokemon Showdown as the authoritative battle engine. The UI never recalculates battle effects. It reads Showdown protocol lines in order, translates them, updates trackers, and plays them as a serial timeline.

## Principles

- Do not deduplicate protocol messages by text. If Showdown emits two heal events, both are real events and both should be shown.
- Do not collapse item, ability, move, drain, weather, hazard, and status messages into one generic result.
- `turn`, `upkeep`, `request`, and timestamp messages update UI state only. They should not block the animation queue.
- Damage and heal animations are driven only by `-damage`, `-heal`, and `-sethp` events. The final request state must not make HP jump early.
- Faint state starts at `faint` and remains visible until the side receives a real `switch`, `drag`, `replace`, `detailschange`, or `-formechange` event.
- The raw order from Showdown is preserved. The only presentation exception is type effectiveness: `-supereffective` and `-resisted` are shown after the related damage event, matching the in-game feel.
- Unknown protocol tags must be visible in debug text instead of silently disappearing.

## Display Mapping

- `move`: message plus attacker animation.
- `switch`, `drag`, `replace`, `detailschange`, `-formechange`: switch/form-change message and sprite replacement.
- `cant`, `-fail`, `-block`, `-notarget`, `-miss`, `-immune`: failure or no-effect message.
- `-damage`, `-heal`, `-sethp`: HP animation with source text from `[from]` and `[of]` tags when present.
- `faint`: faint message and faint sprite state.
- `-status`, `-curestatus`, `-cureteam`, `-start`, `-end`: status or volatile-effect message.
- `-boost`, `-unboost`, `-setboost`, `-swapboost`, `-invertboost`, `-clearboost`, `-clearallboost`, `-clearpositiveboost`, `-clearnegativeboost`, `-copyboost`: stat-stage tracker and message.
- `-weather`, `-fieldstart`, `-fieldend`, `-sidestart`, `-sideend`, `-swapsideconditions`: field/weather/hazard tracker and message.
- `-item`, `-enditem`, `-ability`, `-endability`, `-activate`, `-transform`: item/ability/effect message.
- `-crit`, `-supereffective`, `-resisted`: extra hit result messages.
- `-mega`, `-primal`, `-burst`, `-zpower`, `-zbroken`, `-prepare`, `-mustrecharge`, `-hitcount`, `-singlemove`, `-singleturn`, `-message`, `-hint`: message events.
- `win`, `tie`: final result event after all preceding events finish.

## Debugging

Set `CHANGEBATTLE_DEBUG_SHOWDOWN=1` before starting the desktop app to mirror raw Showdown update lines into the battle log as `Showdown: ...`. This is intentionally noisy and only meant for checking missing protocol coverage.
