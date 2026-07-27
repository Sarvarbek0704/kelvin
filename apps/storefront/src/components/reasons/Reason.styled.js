import styled from 'styled-components';

export const ReasonsSection = styled.section`
  padding: 72px 0;

  .head {
    text-align: center;
    margin-bottom: 40px;
  }

  .head h2 {
    font-size: 40px;
    margin: 6px 0 0;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 28px 0;

    .head {
      text-align: left;
      margin-bottom: 20px;
    }

    .head h2 {
      font-size: 28px;
    }
  }
`;

export const CardsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;

export const ReasonCard = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  padding: 34px 30px;

  .icon {
    width: 52px;
    height: 52px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.deep};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(p) => p.theme.color.brassDark};
    margin-bottom: 20px;
    flex: none;
  }

  .title {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 26px;
    color: ${(p) => p.theme.color.ink};
    margin-bottom: 8px;
  }

  .text {
    font-size: 15px;
    line-height: 1.6;
    color: ${(p) => p.theme.color.bodyText};
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 16px;

    .icon {
      width: 42px;
      height: 42px;
      margin-bottom: 0;
    }

    .title {
      font-size: 20px;
      margin-bottom: 2px;
    }

    .text {
      font-size: 13px;
      color: ${(p) => p.theme.color.inkMuted};
    }
  }
`;
