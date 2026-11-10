export default function AccessDeniedPage() {
  return (
    <main className="min-h-screen bg-[#08090f] px-5 py-12 text-white">
      <section className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-start justify-center">
        <p className="text-sm font-semibold uppercase tracking-[.22em] text-white/45">PelliniDigital</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">Questo tool è riservato ai clienti PelliniDigital.</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/62">
          Apri il tool dalla tua area cliente PelliniDigital dopo l&apos;acquisto. Non serve creare un secondo account.
        </p>
        <a
          href="https://pellinidigital.it"
          className="mt-8 rounded-lg bg-white px-5 py-3 text-sm font-black text-[#08090f] transition hover:bg-white/88 focus:outline-none focus:ring-4 focus:ring-white/25"
        >
          Vai a PelliniDigital
        </a>
      </section>
    </main>
  );
}
