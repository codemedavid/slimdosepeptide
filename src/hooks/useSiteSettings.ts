import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SiteSettings } from '../types';

export const useSiteSettings = () => {
  const data = useQuery(api.siteSettings.listAll);
  const updateValueMutation = useMutation(api.siteSettings.updateValue);
  const upsertManyMutation = useMutation(api.siteSettings.upsertMany);

  const loading = data === undefined;

  const siteSettings = useMemo<SiteSettings | null>(() => {
    if (!data) return null;
    const findValue = (id: string) =>
      (data.find((s: any) => s.id === id) as any)?.value as string | undefined;
    return {
      site_name: findValue('site_name') || 'SlimDose Peptides',
      site_logo: findValue('site_logo') || '/assets/logo.jpeg',
      site_description: findValue('site_description') || '',
      currency: findValue('currency') || 'PHP',
      currency_code: findValue('currency_code') || 'PHP',
      hero_badge_text: findValue('hero_badge_text') || 'Premium Peptide Solutions',
      hero_title_prefix: findValue('hero_title_prefix') || 'Premium',
      hero_title_highlight: findValue('hero_title_highlight') || 'Peptides',
      hero_title_suffix: findValue('hero_title_suffix') || '& Essentials',
      hero_subtext:
        findValue('hero_subtext') ||
        'From the Lab to You — Simplifying Science, One Dose at a Time.',
      hero_tagline:
        findValue('hero_tagline') ||
        'Quality-tested products. Reliable performance. Trusted by our community.',
      hero_description:
        findValue('hero_description') ||
        'SlimDose Peptides is your all-in-one destination for high-quality peptides, peptide pens, and the essential accessories you need for a smooth and confident wellness routine.',
      hero_accent_color: findValue('hero_accent_color') || 'gold-500',
    };
  }, [data]);

  const updateSiteSetting = async (id: string, value: string) => {
    await updateValueMutation({ id, value });
  };

  const updateSiteSettings = async (updates: Partial<SiteSettings>) => {
    await upsertManyMutation({
      items: Object.entries(updates).map(([key, value]) => ({
        id: key,
        value: String(value),
        type: 'string',
      })),
    });
  };

  return {
    siteSettings,
    loading,
    error: null,
    updateSiteSetting,
    updateSiteSettings,
    refetch: () => Promise.resolve(),
  };
};
