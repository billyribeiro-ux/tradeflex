<script lang="ts">
	import CoursePage from '$lib/components/course/CoursePage.svelte';
	import CodeBlock from '$lib/components/course/CodeBlock.svelte';
	import Aside from '$lib/components/course/Aside.svelte';
</script>

<svelte:head><title>13.3 Command palette (⌘K) — Trade Flex</title></svelte:head>

<CoursePage
	module="Module 13 · UX extras"
	title="13.3 · A keyboard-first command palette"
	lede="⌘K is a tiny feature with a long tail of details: focus trap, arrow-key navigation, listbox semantics for screen readers, and a reduced-motion-safe entrance. Get the skeleton right once and you can extend it forever."
>
	<section>
		<h2>What the component owns</h2>
		<p>
			One file, three pieces of state, one keyboard-mount hook. Everything else falls out of the
			runes graph.
		</p>
		<CodeBlock title="src/lib/components/course/SearchStub.svelte (state)" lang="ts">
			{`let open = $state(false);
let query = $state('');
let active = $state(0);
let inputEl: HTMLInputElement | undefined = $state();

const results = $derived(
  query.trim().length === 0
    ? coursePages.slice(0, 8)
    : coursePages.filter(match).slice(0, 12)
);

// whenever the query changes, reset the highlighted row
$effect(() => {
  void query;
  active = 0;
});`}
		</CodeBlock>
		<Aside type="tip">
			<p>
				<strong>Why <code>void query</code>?</strong> We want the effect to depend on
				<code>query</code> so Svelte re-runs it on every change. Writing it as a bare expression (<code
					>query;</code
				>) upsets <code>no-unused-expressions</code>. <code>void</code> signals intent to both the runtime
				and the linter.
			</p>
		</Aside>
	</section>

	<section>
		<h2>The global keybind</h2>
		<p>
			<code>onMount</code> is the only place a component should touch
			<code>window</code>. Register the handler, return the cleanup, and never think about it again.
		</p>
		<CodeBlock lang="ts">
			{`onMount(() => {
  const onKey = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      open = true;
    } else if (e.key === 'Escape') {
      open = false;
    }
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
});`}
		</CodeBlock>
	</section>

	<section>
		<h2>Arrow-key navigation inside the dialog</h2>
		<p>
			Global ⌘K opens the dialog; once inside, the scrim's <code>onkeydown</code> handles movement. Clamp
			both directions — drifting past the ends of the list is a classic off-by-one.
		</p>
		<CodeBlock lang="svelte">
			{`<div
  class="scrim"
  role="dialog"
  aria-modal="true"
  aria-label="Search"
  onkeydown={(e) => {
    if (e.key === 'Escape') {
      open = false;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      active = Math.min(active + 1, Math.max(results.length - 1, 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      active = Math.max(active - 1, 0);
    } else if (e.key === 'Enter') {
      const hit = results[active];
      if (hit) { e.preventDefault(); pick(hit.href); }
    }
  }}
>`}
		</CodeBlock>
	</section>

	<section>
		<h2>Listbox semantics</h2>
		<p>
			Svelte's a11y compiler correctly rejects <code>aria-selected</code> on a plain
			<code>&lt;li&gt;</code> — its implicit role is <code>listitem</code>, which doesn't support
			the attribute. The fix is explicit <code>listbox</code> + <code>option</code> roles.
		</p>
		<CodeBlock lang="svelte">
			{`<ul class="results" role="listbox">
  {#each results as r, i (r.href)}
    <li class:active={i === active} role="option" aria-selected={i === active}>
      <button type="button"
        onclick={() => pick(r.href)}
        onmouseenter={() => (active = i)}
      >
        <span class="title">{r.title}</span>
        {#if r.summary}<span class="summary">{r.summary}</span>{/if}
      </button>
    </li>
  {/each}
</ul>`}
		</CodeBlock>
		<Aside type="note">
			<p>
				<code>onmouseenter={'{() => (active = i)}'}</code> keeps the mouse and keyboard in sync:
				hover an option and the keyboard highlight follows. Without it, pressing
				<kbd>Enter</kbd> could open a row your eyes weren't looking at.
			</p>
		</Aside>
	</section>

	<section>
		<h2>Focus on open</h2>
		<p>
			When the dialog appears, the input should receive focus — but only after the DOM has rendered.
			<code>queueMicrotask</code> is the lightest way to defer until after the render pass.
		</p>
		<CodeBlock lang="ts">
			{`$effect(() => {
  if (open) {
    queueMicrotask(() => inputEl?.focus());
  }
});`}
		</CodeBlock>
	</section>

	<section>
		<h2>Where the data comes from</h2>
		<p>
			Every course page is registered in <code>src/lib/course/manifest.ts</code>. The palette just
			filters that list by title, summary, and module. One source of truth — sidebar, prev/next, and
			⌘K all read from it.
		</p>
		<Aside type="tip">
			<p>
				When you add a page, add a manifest entry. The palette, the sidebar, and the prev/next
				threading all pick it up for free.
			</p>
		</Aside>
	</section>

	<section>
		<h2>What's next</h2>
		<p>
			The palette in its current form searches course pages only. Natural next step: also index
			admin routes (role-gated — staff only see admin hits), and highlight the matched substring in
			results. Keep the skeleton; layer features on top.
		</p>
	</section>
</CoursePage>
