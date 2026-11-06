<script setup lang="ts">
import { practiceAreas } from '@shared/practice-areas'
import { site } from '@shared/site'
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import SplitText from '@/components/SplitText.vue'

/**
 * Optional form endpoint (e.g. Formspree) via VITE_CONTACT_ENDPOINT. Without it the
 * form composes an e-mail to the office, exactly like the original site.
 */
const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT as string | undefined

const form = ref<HTMLFormElement>()
const consent = ref<HTMLInputElement>()
const invalid = ref<Record<string, boolean>>({})
const consentInvalid = ref(false)
const sending = ref(false)
const sent = ref(false)

type Field = HTMLInputElement | HTMLTextAreaElement

const validate = (el: Field) => {
  const ok = el.checkValidity()
  invalid.value = { ...invalid.value, [el.name]: !ok }
  return ok
}
const validateConsent = () => {
  consentInvalid.value = !consent.value!.checked
  return !consentInvalid.value
}
const onBlur = (e: FocusEvent) => {
  const el = e.target as Field
  if (el.value) validate(el)
}
const onInput = (e: Event) => {
  const el = e.target as Field
  if (invalid.value[el.name]) validate(el)
}

async function deliver(data: FormData): Promise<boolean> {
  if (endpoint) {
    const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error(String(res.status))
    return true
  }
  const body = [
    `Ime i prezime: ${data.get('ime')}`,
    `Telefon: ${data.get('telefon')}`,
    `E-pošta: ${data.get('email') || '-'}`,
    `Pravna oblast: ${data.get('oblast') || '-'}`,
    `Način kontakta: ${data.get('kontakt')}`,
    '',
    String(data.get('poruka')),
  ].join('\n')
  const subject = `Upit sa sajta – ${data.get('ime')}`
  window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  return false
}

async function onSubmit() {
  const el = form.value!
  const fields = Array.from(el.querySelectorAll<Field>('input:not([type=radio]):not([type=checkbox]), textarea'))
  let firstBad: Field | null = null
  for (const f of fields) if (!validate(f) && !firstBad) firstBad = f
  const consentOk = validateConsent()
  if (firstBad) return firstBad.focus()
  if (!consentOk) return consent.value!.focus()

  sending.value = true
  try {
    if (await deliver(new FormData(el))) {
      sent.value = true
      el.reset()
    }
  } catch {
    alert(`Slanje nije uspelo. Pozovite nas na ${site.phone} ili pišite na ${site.email}.`)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <section id="kontakt" class="contact">
    <div class="container">
      <div class="contact__head">
        <SplitText class="contact__title" text="Razgovarajte sa nama" />
        <p class="reveal">Na raspolaganju smo za sva pravna pitanja i konsultacije. Obratite nam se telefonom, e-poštom ili putem kontakt forme.</p>
        <a :href="site.phoneHref" class="btn btn--dark reveal"><AppIcon name="phone" class="icon" />Pozovite odmah</a>
      </div>
      <div class="contact__grid">
        <aside class="contact__info">
          <a class="info-card info-card--call reveal" :href="site.phoneHref">
            <span class="info-card__icon" aria-hidden="true"><AppIcon name="phone" /></span>
            <span><small>Mobilni – kliknite za poziv</small><strong>{{ site.phone }}</strong></span>
            <span class="info-card__arrow" aria-hidden="true">→</span>
          </a>
          <a class="info-card reveal" :href="`mailto:${site.email}`">
            <span class="info-card__icon" aria-hidden="true"><AppIcon name="mail" /></span>
            <span><small>E-pošta</small><strong>{{ site.email }}</strong></span>
            <span class="info-card__arrow" aria-hidden="true">→</span>
          </a>
          <a class="info-card reveal" :href="site.mapsUrl" target="_blank" rel="noopener">
            <span class="info-card__icon" aria-hidden="true"><AppIcon name="pin" /></span>
            <span><small>Adresa</small><strong>{{ site.address }}</strong></span>
            <span class="info-card__arrow" aria-hidden="true">→</span>
          </a>
          <a class="info-card reveal" :href="site.calendlyUrl" target="_blank" rel="noopener">
            <span class="info-card__icon" aria-hidden="true"><AppIcon name="video" /></span>
            <span><small>Online konsultacije</small><strong>Zakažite termin online</strong></span>
            <span class="info-card__arrow" aria-hidden="true">→</span>
          </a>
          <div class="info-card reveal">
            <span class="info-card__icon" aria-hidden="true"><AppIcon name="clock" /></span>
            <span><small>Radno vreme</small><strong>{{ site.hours }}</strong></span>
          </div>
        </aside>

        <form id="contact-form" ref="form" class="form reveal" novalidate @submit.prevent="onSubmit">
          <div class="form__head">
            <p class="eyebrow"><span class="eyebrow__line"></span>Kontakt forma</p>
            <h3>Opišite nam vaš slučaj</h3>
            <p>Odgovaramo u najkraćem mogućem roku. Sve informacije su poverljive.</p>
          </div>
          <div class="form__row">
            <div class="field" :class="{ 'is-invalid': invalid.ime }">
              <label for="f-name">Ime i prezime *</label>
              <input id="f-name" name="ime" type="text" autocomplete="name" placeholder="Petar Petrović" required @blur="onBlur" @input="onInput" />
              <span class="field__error">Unesite vaše ime i prezime.</span>
            </div>
            <div class="field" :class="{ 'is-invalid': invalid.telefon }">
              <label for="f-phone">Telefon *</label>
              <input
                id="f-phone"
                name="telefon"
                type="tel"
                autocomplete="tel"
                placeholder="+381 6x xxx xxxx"
                required
                pattern="[0-9+\(\)\/\s\-]{6,}"
                @blur="onBlur"
                @input="onInput"
              />
              <span class="field__error">Unesite ispravan broj telefona.</span>
            </div>
          </div>
          <div class="form__row">
            <div class="field" :class="{ 'is-invalid': invalid.email }">
              <label for="f-email">E-pošta</label>
              <input id="f-email" name="email" type="email" autocomplete="email" placeholder="vas@email.com" @blur="onBlur" @input="onInput" />
              <span class="field__error">Unesite ispravnu adresu e-pošte.</span>
            </div>
            <div class="field">
              <label for="f-area">Pravna oblast</label>
              <select id="f-area" name="oblast">
                <option value="">Izaberite oblast</option>
                <option v-for="a in practiceAreas" :key="a.slug">{{ a.name }}</option>
                <option>Drugo</option>
              </select>
            </div>
          </div>
          <fieldset class="field">
            <legend>Kako da vas kontaktiramo?</legend>
            <div class="chips">
              <label class="chip"><input type="radio" name="kontakt" value="Telefon" checked /><span>Telefonom</span></label>
              <label class="chip"><input type="radio" name="kontakt" value="E-pošta" /><span>E-poštom</span></label>
              <label class="chip"><input type="radio" name="kontakt" value="Online konsultacije" /><span>Online konsultacije</span></label>
            </div>
          </fieldset>
          <div class="field" :class="{ 'is-invalid': invalid.poruka }">
            <label for="f-msg">Poruka *</label>
            <textarea
              id="f-msg"
              name="poruka"
              rows="5"
              placeholder="Ukratko opišite vaše pravno pitanje…"
              required
              minlength="10"
              @blur="onBlur"
              @input="onInput"
            ></textarea>
            <span class="field__error">Poruka treba da ima najmanje 10 karaktera.</span>
          </div>
          <label class="check" :class="{ 'is-invalid': consentInvalid }">
            <input ref="consent" type="checkbox" name="saglasnost" required @change="validateConsent" />
            <span
              >Saglasan/na sam sa
              <a :href="site.privacyUrl" target="_blank" rel="noopener">politikom privatnosti</a> i da kancelarija koristi moje podatke
              isključivo radi odgovora na ovaj upit.</span
            >
          </label>
          <span class="field__error field__error--check">Potrebna je vaša saglasnost.</span>
          <div class="form__footer">
            <button type="submit" class="btn btn--dark btn--lg" :disabled="sending">
              {{ sending ? 'Slanje… ' : 'Pošaljite poruku ' }}<span aria-hidden="true">→</span>
            </button>
            <p class="form__alt">ili pozovite: <a :href="site.phoneHref">{{ site.phone }}</a></p>
          </div>
          <div class="form__success" role="status" aria-live="polite" :hidden="!sent">
            <span class="form__success-icon" aria-hidden="true">✓</span>
            <h3>Hvala vam na poruci!</h3>
            <p>Javićemo vam se u najkraćem roku. Za hitne slučajeve pozovite <a :href="site.phoneHref">{{ site.phone }}</a>.</p>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
