'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { menuQueryOptions } from '@/lib/queries/menu';
import { FlowingMenu } from './FlowingMenu';
import { toFlowingMenuItems } from './flowing-menu-data';

export const FlowingMenuSection = () => {
  const { data } = useSuspenseQuery(menuQueryOptions());

  return <FlowingMenu items={toFlowingMenuItems(data)} />;
};

export default FlowingMenuSection;
