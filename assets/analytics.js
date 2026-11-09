/* Privacy-minimal portfolio analytics. No cookies, IP capture, visitor identifiers, or localStorage.
   A 'visit' is one browsing tab session; page views record each page load. */
(() => {
  'use strict';
  const base = document.documentElement.dataset.siteBase || '';
  const prefix = base + '/';
  if (!location.pathname.startsWith(prefix) || location.pathname.startsWith(prefix + 'dan/') || new URLSearchParams(location.search).has('portfolio_preview')) return;
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl === true) return;
  const pagePath = location.pathname.slice(0,240);
  const folder = `${base}:portfolio-metrics:entered`;
  let firstEntry = true;
  try { firstEntry = sessionStorage.getItem(folder) !== '1'; } catch (_) {}
  let source = 'Direct / unknown';
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.hostname !== location.hostname) source = ref.hostname.slice(0,120);
    else if (!firstEntry) source = 'Internal navigation';
  } catch (_) {}
  const tz = String(Intl.DateTimeFormat().resolvedOptions().timeZone || 'Not provided').slice(0,70);
  const language = String(navigator.language || 'Unknown').slice(0,35);
  const device = /Android|iPhone|iPad|iPod|Mobi/i.test(navigator.userAgent) ? 'Mobile / tablet' : 'Desktop';
  const row = type => ({ event_type:type, path:pagePath, source, timezone:tz, browser_language:language, device_type:device });
  async function send() {
    try {
      const response=await fetch(prefix+'assets/backend.json',{cache:'no-store'});
      if (!response.ok) return;
      const config=await response.json();
      if (!/^https:\/\/[-a-z0-9]+\.supabase\.co$/i.test(config.url||'') || !config.publishableKey) return;
      const events=firstEntry?[row('entry'),row('pageview')]:[row('pageview')];
      const result=await fetch(config.url+'/rest/v1/portfolio_pageviews',{
        method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(events),keepalive:true
      });
      if (result.ok && firstEntry) {
        try {sessionStorage.setItem(folder,'1');}catch(_){}
      }
    } catch (_) { /* Tracking must never break the portfolio. */ }
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',send,{once:true});
  else send();
})();
