import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export const useCOAPageSetting = () => {
  const setting = useQuery(api.siteSettings.getOne, { id: 'coa_page_enabled' });
  const loading = setting === undefined;
  // Default to enabled if the setting doesn't exist or is missing.
  const value = (setting as any)?.value;
  const coaPageEnabled = setting === null || value === undefined ? true : value === 'true' || value === true;
  return { coaPageEnabled, loading };
};
