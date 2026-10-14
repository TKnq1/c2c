"use client";

import { useMemo, useState, useTransition } from "react";
import { saveBusinessProfileAction, checkVatIdAction, lookupVatIdAction } from "@/lib/actions/business";
import { toast } from "@/lib/toast";
import { EU_COUNTRIES } from "@/lib/tax/vat-id";
import { DealActionButton, DealForm } from "@/components/deals/deal-form";
import { useDealText } from "@/components/deals/use-deal-text";
import { Badge, Field, inputClass } from "@/components/deals/ui";
import { useI18n } from "@/components/i18n-provider";
import { dealLocale } from "@/lib/deals/copy";
import type { BusinessActionState } from "@/lib/deals/action-state";

export type BusinessFormValues = {
  legalName: string;
  businessType: string;
  country: string;
  addressLine1: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  phone: string;
  registerNumber: string;
  taxNumber: string;
  vatId: string;
  smallBusinessExempt: boolean;
  traderSelfCertified: boolean;
  selfBillingAccepted: boolean;
};

export type VatInfo = {
  status: "UNCHECKED" | "VALID" | "INVALID" | "UNAVAILABLE";
  registeredName: string | null;
  consultationNumber: string | null;
};

const EXTRA_COUNTRIES = ["CH", "GB", "NO", "IS", "LI", "US", "CA", "AU", "AE", "TR"];

export function BusinessForm({ role, initial, vat }: { role: "STARTUP" | "CREATOR"; initial: BusinessFormValues; vat: VatInfo }) {
  const u = useDealText();
  const { locale } = useI18n();
  const language = dealLocale(locale);
  const [country, setCountry] = useState(initial.country);
  const [vatStatus, setVatStatus] = useState<VatInfo["status"]>(vat.status);
  // Controlled, so the VAT ID lookup can fill them in.
  const [legalName, setLegalName] = useState(initial.legalName);
  const [addressLine1, setAddressLine1] = useState(initial.addressLine1);
  const [addressLine2, setAddressLine2] = useState(initial.addressLine2);
  const [postalCode, setPostalCode] = useState(initial.postalCode);
  const [city, setCity] = useState(initial.city);
  const [vatId, setVatId] = useState(initial.vatId);
  const [lookupNote, setLookupNote] = useState<string | null>(null);
  const [looking, startLookup] = useTransition();

  // Asks VIES what it knows about the VAT ID in the form and fills in name, address and country, after a question when that
  // would replace something typed.
  const fillFromVat = () =>
    startLookup(async () => {
      setLookupNote(null);
      if (!vatId.trim()) return setLookupNote(u("business.vatFillEmpty"));
      const result = await lookupVatIdAction(vatId).catch(() => null);
      if (!result) return setLookupNote(u("form.somethingWrong"));
      if (!result.ok) return setLookupNote(result.error);
      if (result.status === "INVALID") return setLookupNote(u("business.vatFillInvalid"));
      if (result.status !== "VALID") return setLookupNote(u("business.vatFillDown"));
      if (!result.name && !result.address) return setLookupNote(u("business.vatFillNothing"));
      const typed = [legalName, addressLine1, postalCode, city].some((value) => value.trim() !== "");
      if (typed && !window.confirm(u("business.vatFillReplace"))) return;
      if (result.name) setLegalName(result.name);
      if (result.address) {
        setAddressLine1(result.address.addressLine1);
        setAddressLine2(result.address.addressLine2);
        setPostalCode(result.address.postalCode);
        setCity(result.address.city);
      }
      setCountry(result.country);
      setLookupNote(u("business.vatFillDone"));
      toast.success(u("business.vatFillDone"));
    });

  const countries = useMemo(() => {
    const names = new Intl.DisplayNames([language === "de" ? "de" : "en"], { type: "region" });
    return [...EU_COUNTRIES, ...EXTRA_COUNTRIES].map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name, language));
  }, [language]);

  const needsVatId = country !== "DE" && (EU_COUNTRIES as readonly string[]).includes(country);

  return (
    <DealForm<NonNullable<BusinessActionState> | undefined>
      action={saveBusinessProfileAction}
      successMessage={u("business.saved")}
      submitLabel={u("business.save")}
      onDone={(result) => result?.vatStatus && setVatStatus(result.vatStatus)}
    >
      {(state) => (
        <>
          <Field label={u("business.legalName")} hint={u("business.legalNameHint")} name="legalName" issues={state?.issues}>
            <input name="legalName" required value={legalName} onChange={(e) => setLegalName(e.target.value)} maxLength={160} autoComplete="organization" className={inputClass} />
          </Field>
          <Field label={u("business.type")} name="businessType" issues={state?.issues}>
            <select name="businessType" defaultValue={initial.businessType || (role === "STARTUP" ? "COMPANY" : "FREELANCER")} className={inputClass}>
              <option value="COMPANY">{u("business.type.COMPANY")}</option>
              <option value="SOLE_PROPRIETOR">{u("business.type.SOLE_PROPRIETOR")}</option>
              <option value="FREELANCER">{u("business.type.FREELANCER")}</option>
            </select>
          </Field>
          <Field label={u("business.country")} name="country" issues={state?.issues}>
            <select name="country" value={country} onChange={(e) => setCountry(e.target.value)} className={inputClass}>
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={u("business.address1")} name="addressLine1" issues={state?.issues}>
            <input name="addressLine1" required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} maxLength={160} autoComplete="address-line1" className={inputClass} />
          </Field>
          <Field label={u("business.address2")}>
            <input name="addressLine2" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} maxLength={160} autoComplete="address-line2" className={inputClass} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
            <Field label={u("business.postalCode")} name="postalCode" issues={state?.issues}>
              <input name="postalCode" required value={postalCode} onChange={(e) => setPostalCode(e.target.value)} maxLength={20} autoComplete="postal-code" className={inputClass} />
            </Field>
            <Field label={u("business.city")} name="city" issues={state?.issues}>
              <input name="city" required value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} autoComplete="address-level2" className={inputClass} />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={u("business.phone")}>
              <input name="phone" type="tel" defaultValue={initial.phone} maxLength={40} autoComplete="tel" className={inputClass} />
            </Field>
            <Field label={u("business.register")}>
              <input name="registerNumber" defaultValue={initial.registerNumber} maxLength={60} className={inputClass} />
            </Field>
          </div>

          <Field label={u("business.taxNumber")} hint={country === "DE" ? u("business.taxNumberHint") : undefined} name="taxNumber" issues={state?.issues}>
            <input name="taxNumber" defaultValue={initial.taxNumber} maxLength={40} className={inputClass} />
          </Field>
          <Field label={u("business.vatId")} hint={needsVatId ? u("business.vatIdHint") : undefined} name="vatId" issues={state?.issues}>
            <input name="vatId" value={vatId} onChange={(e) => setVatId(e.target.value)} maxLength={30} autoCapitalize="characters" spellCheck={false} placeholder="DE123456789" className={inputClass} />
          </Field>
          <div className="-mt-1 flex flex-col items-start gap-1">
            <button type="button" onClick={fillFromVat} disabled={looking} className="text-sm underline disabled:opacity-50">
              {looking ? u("business.vatFillWorking") : u("business.vatFill")}
            </button>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">{lookupNote ?? u("business.vatFillHint")}</span>
          </div>
          {initial.vatId && (
            <div className="-mt-1 flex flex-wrap items-center gap-3 text-sm">
              <Badge strong={vatStatus === "VALID"}>{u(`business.vatStatus.${vatStatus}`)}</Badge>
              {vatStatus === "VALID" && vat.registeredName && <span className="text-neutral-500 dark:text-neutral-400">{u("business.vatRegistered", { name: vat.registeredName })}</span>}
              {vatStatus === "VALID" && vat.consultationNumber && <span className="text-xs text-neutral-500 dark:text-neutral-400">{u("business.vatConsultation", { number: vat.consultationNumber })}</span>}
              {vatStatus !== "VALID" && (
                <DealActionButton
                  variant="secondary"
                  label={u("business.vatCheck")}
                  successMessage={u("business.vatChecked")}
                  action={async () => {
                    const result = await checkVatIdAction(undefined);
                    if (result?.vatStatus) setVatStatus(result.vatStatus);
                    return result;
                  }}
                />
              )}
            </div>
          )}

          {role === "CREATOR" && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="smallBusinessExempt" value="true" defaultChecked={initial.smallBusinessExempt} className="mt-0.5" />
              <span>{u("business.smallBusiness")}</span>
            </label>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" name="traderSelfCertified" value="true" defaultChecked={initial.traderSelfCertified} className="mt-0.5" />
            <span>{u("business.trader")}</span>
          </label>
          {role === "CREATOR" && (
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" name="selfBillingAccepted" value="true" defaultChecked={initial.selfBillingAccepted} className="mt-0.5" />
              <span>{u("business.selfBilling")}</span>
            </label>
          )}
        </>
      )}
    </DealForm>
  );
}
