import BN from "bn.js";

export const formatBN = (value: BN, decimals: number = 6): string => {
  const divisor = new BN(10).pow(new BN(decimals));
  const quotient = value.div(divisor);
  const remainder = value.mod(divisor);
  
  if (remainder.isZero()) {
    return quotient.toString();
  }
  
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, '');
  
  if (trimmedRemainder === '') {
    return quotient.toString();
  }
  
  return `${quotient.toString()}.${trimmedRemainder}`;
};

export const parseBN = (value: string, decimals: number = 6): BN => {
  const [integerPart, decimalPart = ''] = value.split('.');
  const paddedDecimal = decimalPart.padEnd(decimals, '0').slice(0, decimals);
  const fullValue = integerPart + paddedDecimal;
  return new BN(fullValue);
};
