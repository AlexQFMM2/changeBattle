# Showdown Battle Log Interpretation

ChangeBattle treats Pokemon Showdown as the authoritative battle engine. The UI never recalculates battle effects. It reads Showdown protocol lines in order, translates them, updates trackers, and plays them as a serial timeline.

For the frontend playback order, animation queue, and scenario references, see [`battle-timeline-flow.md`](./battle-timeline-flow.md).

For stable Pokemon identity, `showdown_id`/`pokeball` transport, side detection, and saveback rules, see [`showdown-identity.md`](./showdown-identity.md).

For local team / Showdown team sync and the battle page display projection, see [`battle-team-state-flow.md`](./battle-team-state-flow.md).

## Principles

- Do not deduplicate protocol messages by text. If Showdown emits two heal events, both are real events and both should be shown.
- Do not collapse item, ability, move, drain, weather, hazard, and status messages into one generic result.
- Do not use Showdown `ident`, Pokemon name, species name, or localized display name as a stable Pokemon identity. They are presentation labels and can collide.
- `turn`, `upkeep`, `request`, and timestamp messages update UI state only. They should not block the animation queue.
- Timeline events drive playback and active animation changes; the final battle page display projection is `battle_view`.
- Damage and heal animations are driven only by `-damage`, `-heal`, and `-sethp` events. The final request state must not make HP jump early.
- Faint state starts at `faint` and remains visible until the side receives a real `switch`, `drag`, `replace`, `detailschange`, or `-formechange` event.
- The raw order from Showdown is preserved. The only presentation exception is type effectiveness: `-supereffective` and `-resisted` are shown after the related damage event, matching the in-game feel.
- Unknown protocol tags must be visible in debug text instead of silently disappearing.

## Pokemon Identity

ChangeBattle local team objects use `showdown_id` as the stable battle identity. This field follows the Pokemon object through lead changes, team rotation, exchange, battle state saveback, and UI playback. It is not a cosmetic Poke Ball choice.

Pokemon Showdown does not provide a unique per-Pokemon id in protocol lines. Its `ident` is name/species-like text and is not reliable when two Pokemon share a name or species. To bridge that gap, ChangeBattle writes each local `showdown_id` into the packed Showdown set as the legal Showdown `pokeball` value. Showdown preserves that value in request side state, so request diffs and UI tracker state can recover `side + showdown_id`.

Keep these meanings separate:

- `showdown_id`: ChangeBattle identity field. Use this for state sync, request diff matching, animation gating, HP/status updates, and battle-end saveback.
- `PokemonSet.pokeball`: Showdown transport field. ChangeBattle sets it to `showdown_id` immediately before packing teams.
- Future cosmetic ball data: use a separate field such as `pokeball` or a display-specific field, but do not use it for identity.

Timeline events should carry `source_showdown_id` and/or `target_showdown_id` whenever the parser can infer them. The renderer must prefer these fields over names. If an event has a `target_showdown_id` but it does not match the currently displayed active Pokemon for that side, the UI should skip the active HP/status/animation mutation instead of guessing.

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
