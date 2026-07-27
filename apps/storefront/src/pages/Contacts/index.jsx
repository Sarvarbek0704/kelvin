import React, { useState } from 'react';
import styled from 'styled-components';
import { api } from '../../lib/api';
import {
  Container,
  Kicker,
  Button,
  Input,
  FieldLabel,
  FieldError,
} from '../../components/ui';

const ContactsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 0;
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: 18px;
  overflow: hidden;
  margin: 40px 0 64px;
  background: ${(p) => p.theme.color.surface};

  .info {
    padding: 48px 40px;
  }

  h1 {
    font-size: 44px;
    margin: 10px 0 28px;
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 22px;
  }

  .cap {
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.inkMuted};
    margin-bottom: 6px;
  }

  .val {
    font-size: 17px;
    color: ${(p) => p.theme.color.ink};

    a {
      color: ${(p) => p.theme.color.ink};

      &:hover {
        color: ${(p) => p.theme.color.brassDark};
      }
    }
  }

  .map {
    position: relative;
    min-height: 420px;

    iframe {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      border: 0;
      filter: sepia(0.25) saturate(0.85);
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
    margin: 20px 0 40px;

    .info {
      padding: 28px 20px;
    }

    h1 {
      font-size: 32px;
    }

    .map {
      min-height: 280px;
    }
  }
`;

const CallbackWrap = styled.form`
  margin-top: 32px;
  padding-top: 26px;
  border-top: 1px solid rgba(138, 106, 59, 0.16);
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 340px;

  h3 {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 24px;
    font-weight: 500;
    color: ${(p) => p.theme.color.ink};
    margin: 0 0 4px;
  }

  .ok {
    color: ${(p) => p.theme.color.success};
    font-size: 14px;
  }
`;

// Callback (lid) formasi — CRM'ga yuboradi (POST /leads, docs/10).
function CallbackForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  const [msg, setMsg] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setState('sending');
    setMsg('');
    try {
      await api.post('/leads', { name: name || undefined, phone, source: 'WEBSITE_FORM' });
      setState('sent');
      setName('');
      setPhone('+998');
    } catch (err) {
      setState('error');
      setMsg(err?.problem?.detail || 'Номер в формате +998XXXXXXXXX');
    }
  };

  if (state === 'sent') {
    return (
      <CallbackWrap as="div">
        <h3>Заказать звонок</h3>
        <p className="ok">✓ Заявка принята — мы перезвоним вам.</p>
      </CallbackWrap>
    );
  }

  return (
    <CallbackWrap onSubmit={submit}>
      <h3>Заказать звонок</h3>
      <div>
        <FieldLabel htmlFor="cb-name">Имя</FieldLabel>
        <Input id="cb-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <FieldLabel htmlFor="cb-phone">Телефон</FieldLabel>
        <Input
          id="cb-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+998901234567"
          required
        />
      </div>
      <Button type="submit" $size="sm" disabled={state === 'sending'}>
        {state === 'sending' ? 'Отправка…' : 'Отправить'}
      </Button>
      {state === 'error' && <FieldError>{msg}</FieldError>}
    </CallbackWrap>
  );
}

function Contacts() {
  return (
    <Container>
      <ContactsGrid>
        <div className="info">
          <Kicker as="div">Контакты</Kicker>
          <h1>Приходите за светом</h1>
          <div className="rows">
            <div>
              <div className="cap">Шоурум</div>
              <div className="val">г. Ташкент, ул. Амира Темура, 42</div>
            </div>
            <div>
              <div className="cap">Часы работы</div>
              <div className="val">Ежедневно 10:00 — 20:00</div>
            </div>
            <div>
              <div className="cap">Телефон</div>
              <div className="val">
                <a href="tel:+998712004000">+998 (71) 200-40-00</a>
              </div>
            </div>
            <div>
              <div className="cap">Почта</div>
              <div className="val">
                <a href="mailto:info@kelvin.uz">info@kelvin.uz</a>
              </div>
            </div>
          </div>

          <CallbackForm />
        </div>

        <div className="map">
          <iframe
            src="https://www.google.com/maps?q=41.2995,69.2401&hl=ru&z=15&output=embed"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Kelvin на карте — Ташкент"
          />
        </div>
      </ContactsGrid>
    </Container>
  );
}

export default Contacts;
