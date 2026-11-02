import { useEffect, useRef, useState } from 'react'

const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY

export function CaptchaField({ onChange }) {
  const container = useRef(null)
  const [fallback, setFallback] = useState(!siteKey)

  useEffect(() => {
    if (!siteKey) return undefined
    const render = () => {
      if (window.grecaptcha && container.current) {
        window.grecaptcha.render(container.current, { sitekey: siteKey, callback: onChange })
      }
    }
    const existing = document.querySelector('script[data-recaptcha]')
    if (existing) {
      window.grecaptcha?.ready(render)
    } else {
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.recaptcha = 'true'
      script.onload = render
      script.onerror = () => setFallback(true)
      document.head.appendChild(script)
    }
    return undefined
  }, [onChange])

  if (fallback) {
    return <label className="captcha"><input type="checkbox" onChange={(event) => onChange(event.target.checked ? 'mock-captcha' : '')} /> No soy un robot</label>
  }
  return <div ref={container} className="captcha-widget" />
}
