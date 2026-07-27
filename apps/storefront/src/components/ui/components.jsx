import React from 'react';
import styled, { useTheme } from 'styled-components';
import { Kicker, Hairline, Button } from './primitives';
import { IconCheck, IconStar } from './icons';

/**
 * Warm-boutique kompozit UI bo'laklari — bo'lim sarlavhasi, temperatura
 * selektori, stepper, reyting, bo'sh holat, checkbox/radio/toggle.
 * Faqat ko'rinish; holat propslar orqali tashqaridan.
 */

// ---------- Bo'lim sarlavhasi (kicker + title + guruch hairline) ----------

const SectionHeadWrap = styled.div`
  margin-bottom: 28px;

  .row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  h2 {
    font-size: 36px;
    line-height: 1.15;
    margin: 6px 0 0;

    @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
      font-size: 28px;
    }
  }
`;

export function SectionHead({ kicker, title, action, as = 'h2' }) {
  const Tag = as;
  return (
    <SectionHeadWrap>
      {kicker && <Kicker>{kicker}</Kicker>}
      <div className="row">
        <Tag as={as}>{title}</Tag>
        {action}
      </div>
      <Hairline style={{ margin: '18px 0 0' }} />
    </SectionHeadWrap>
  );
}

// ---------- Temperatura selektori (signature) ----------

const TempWrap = styled.div`
  display: inline-block;

  .swatches {
    position: relative;
    display: inline-flex;
    gap: ${(p) => p.$gap}px;
    padding: 4px;
  }

  .ring {
    position: absolute;
    top: 0;
    left: 0;
    width: ${(p) => p.$size + 8}px;
    height: ${(p) => p.$size + 8}px;
    border-radius: 999px;
    box-shadow: 0 0 0 2px ${(p) => p.theme.color.surface},
      0 0 0 4px ${(p) => p.theme.color.brass};
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
    pointer-events: none;
  }

  .swatch {
    position: relative;
    width: ${(p) => p.$size}px;
    height: ${(p) => p.$size}px;
    margin: 4px;
    border-radius: 999px;
    border: 1px solid ${(p) => p.theme.color.borderStrong};
    padding: 0;
    cursor: pointer;
  }

  .labels {
    display: flex;
    gap: ${(p) => p.$gap}px;
    padding: 0 4px;
    margin-top: 10px;
  }

  .labels span {
    width: ${(p) => p.$size + 8}px;
    text-align: center;
    font-size: 12px;
    color: ${(p) => p.theme.color.inkMuted};
  }
`;

/**
 * Rang harorati selektori — dumaloq swatchlar, aktivida sirg'aluvchi guruch
 * halqa (transform .35s). `values` — kelvin sonlari (masalan [2700,3000,4000]).
 */
export function TempSelector({ values, value, onChange, size = 44, gap = 12, showLabels = true }) {
  const theme = useTheme();
  const idx = Math.max(0, values.indexOf(value));
  const step = size + 8 + gap;

  return (
    <TempWrap $size={size} $gap={gap}>
      <div className="swatches">
        <span className="ring" style={{ transform: `translateX(${idx * step}px)` }} />
        {values.map((k) => (
          <button
            key={k}
            type="button"
            className="swatch"
            style={{ background: theme.temp[k] ?? theme.color.deep }}
            aria-label={`${k}K`}
            aria-pressed={k === value}
            onClick={() => onChange?.(k)}
          />
        ))}
      </div>
      {showLabels && (
        <div className="labels">
          {values.map((k) => (
            <span key={k}>{k}K</span>
          ))}
        </div>
      )}
    </TempWrap>
  );
}

// ---------- Temperatura nuqtalari (kartada) ----------

const DotsRow = styled.div`
  display: flex;
  gap: 5px;

  span {
    width: 12px;
    height: 12px;
    border-radius: 999px;
    border: 1px solid rgba(138, 106, 59, 0.25);
  }
`;

export function TempDots({ values = [], max = 3 }) {
  const theme = useTheme();
  if (!values.length) return null;
  return (
    <DotsRow aria-hidden="true">
      {values.slice(0, max).map((k) => (
        <span key={k} style={{ background: theme.temp[k] ?? theme.color.deep }} />
      ))}
    </DotsRow>
  );
}

// ---------- Miqdor stepperi ----------

const StepperWrap = styled.div`
  display: inline-flex;
  align-items: center;
  border: 1px solid ${(p) => p.theme.color.borderStrong};
  border-radius: ${(p) => p.theme.radius.button};
  overflow: hidden;
  background: ${(p) => p.theme.color.surface};

  button {
    width: ${(p) => (p.$size === 'sm' ? '38px' : '46px')};
    height: ${(p) => (p.$size === 'sm' ? '38px' : '46px')};
    border: 0;
    background: transparent;
    color: ${(p) => p.theme.color.ink};
    font-size: 20px;
    line-height: 1;
    cursor: pointer;

    &:disabled {
      opacity: 0.38;
      cursor: not-allowed;
    }
  }

  .qty {
    width: ${(p) => (p.$size === 'sm' ? '44px' : '56px')};
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    border-left: 1px solid rgba(138, 106, 59, 0.2);
    border-right: 1px solid rgba(138, 106, 59, 0.2);
    line-height: ${(p) => (p.$size === 'sm' ? '38px' : '46px')};
  }
`;

export function Stepper({ value, onDec, onInc, min = 1, size, disabled = false }) {
  return (
    <StepperWrap $size={size}>
      <button type="button" onClick={onDec} disabled={disabled || value <= min} aria-label="Меньше">
        −
      </button>
      <div className="qty">{value}</div>
      <button type="button" onClick={onInc} disabled={disabled} aria-label="Больше">
        +
      </button>
    </StepperWrap>
  );
}

// ---------- Reyting (guruch yulduzlar) ----------

const RatingRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: ${(p) => p.theme.color.brass};
`;

export function Rating({ value = 0, size = 16 }) {
  const full = Math.round(value);
  return (
    <RatingRow role="img" aria-label={`Оценка ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <IconStar key={i} size={size} filled={i <= full} />
      ))}
    </RatingRow>
  );
}

// ---------- Bo'sh holat ----------

const EmptyWrap = styled.div`
  text-align: center;
  padding: 56px 24px;

  .icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 18px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.deep};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(p) => p.theme.color.brassDark};
  }

  .title {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 26px;
    color: ${(p) => p.theme.color.ink};
    margin-bottom: 6px;
  }

  .text {
    font-size: 14px;
    color: ${(p) => p.theme.color.inkMuted};
    line-height: 1.6;
    margin-bottom: 18px;
    max-width: 320px;
    margin-left: auto;
    margin-right: auto;
  }
`;

export function EmptyState({ icon, title, text, actionLabel, onAction }) {
  return (
    <EmptyWrap>
      {icon && <div className="icon">{icon}</div>}
      <div className="title">{title}</div>
      {text && <div className="text">{text}</div>}
      {actionLabel && (
        <Button type="button" $size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </EmptyWrap>
  );
}

// ---------- Checkbox / Radio / Toggle ----------

const CheckRow = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  cursor: pointer;
  ${(p) => p.$disabled && 'opacity: .4; cursor: not-allowed;'}

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .box {
    width: 20px;
    height: 20px;
    flex: none;
    border-radius: ${(p) => (p.$round ? '999px' : '6px')};
    border: 1.5px solid ${(p) => p.theme.color.brass};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(p) => p.theme.color.surface};
    transition: background 0.15s ease;
  }

  input:checked + .box {
    background: ${(p) => (p.$round ? 'transparent' : p.theme.color.brass)};
  }

  input:focus-visible + .box {
    box-shadow: ${(p) => p.theme.focusRing};
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.brass};
    opacity: 0;
  }

  input:checked + .box .dot {
    opacity: 1;
  }
`;

export function Checkbox({ checked, onChange, children, disabled = false }) {
  return (
    <CheckRow $disabled={disabled}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="box">{checked && <IconCheck size={12} strokeWidth="3" />}</span>
      {children}
    </CheckRow>
  );
}

export function Radio({ checked, onChange, name, children, disabled = false }) {
  return (
    <CheckRow $round $disabled={disabled}>
      <input type="radio" name={name} checked={checked} onChange={onChange} disabled={disabled} />
      <span className="box">
        <span className="dot" />
      </span>
      {children}
    </CheckRow>
  );
}

const ToggleWrap = styled.button`
  width: 44px;
  height: 26px;
  border-radius: 999px;
  border: 0;
  padding: 0;
  position: relative;
  cursor: pointer;
  background: ${(p) => (p.$on ? p.theme.color.brass : p.theme.color.deep)};
  transition: background 0.2s ease;

  span {
    position: absolute;
    top: 3px;
    left: ${(p) => (p.$on ? '21px' : '3px')};
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.surface};
    transition: left 0.2s ease;
  }
`;

export function Toggle({ on, onChange, label }) {
  return (
    <ToggleWrap type="button" $on={on} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange?.(!on)}>
      <span />
    </ToggleWrap>
  );
}
