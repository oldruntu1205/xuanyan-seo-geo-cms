'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main style={{padding:'12vh 8vw'}}><h1>Temporarily unavailable</h1><p>Please try again shortly.</p><button onClick={reset}>Try again</button></main>}
