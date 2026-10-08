import { mapSeasonTextToIds } from '@/utils/plantingNow';

describe('mapSeasonTextToIds', () => {
  it('maps "Year Round" to every season', () => {
    expect([...mapSeasonTextToIds('Year Round')].sort()).toEqual([
      'cool_dry',
      'ne_monsoon',
      'summer',
      'sw_monsoon',
    ]);
  });

  it('maps summer phrasing', () => {
    expect([...mapSeasonTextToIds('Summer (Feb–May)')]).toEqual(['summer']);
  });

  it('maps SW monsoon / Kharif phrasing', () => {
    expect(mapSeasonTextToIds('Southwest Monsoon (Jun-Sep)').has('sw_monsoon')).toBe(true);
    expect(mapSeasonTextToIds('Kharif (Jun–Sep)').has('sw_monsoon')).toBe(true);
  });

  it('maps Rabi/winter to cool_dry and ne_monsoon', () => {
    const ids = mapSeasonTextToIds('Rabi (Oct–Jan)');
    expect(ids.has('cool_dry')).toBe(true);
    expect(ids.has('ne_monsoon')).toBe(true);
  });

  it('maps the zone-model season vocabulary', () => {
    expect([...mapSeasonTextToIds('SW Monsoon (Jun–Sep)')]).toEqual(['sw_monsoon']);
    expect([...mapSeasonTextToIds('NE Monsoon (Oct–Dec)')]).toEqual(['ne_monsoon']);
    expect([...mapSeasonTextToIds('Winter (Jan–Feb)')]).toEqual(['cool_dry']);
    expect([...mapSeasonTextToIds('Summer (Mar–May)')]).toEqual(['summer']);
    expect(new Set(mapSeasonTextToIds('SW + NE Monsoon (Jun–Dec)'))).toEqual(
      new Set(['sw_monsoon', 'ne_monsoon'])
    );
    expect(new Set(mapSeasonTextToIds('NE Monsoon + Winter (Oct–Feb)'))).toEqual(
      new Set(['ne_monsoon', 'cool_dry'])
    );
    expect(new Set(mapSeasonTextToIds('Winter + Summer (Jan–May)'))).toEqual(
      new Set(['cool_dry', 'summer'])
    );
  });

  it('reads sowing windows written only in months', () => {
    expect(new Set(mapSeasonTextToIds('June–July and October–November'))).toEqual(
      new Set(['sw_monsoon', 'ne_monsoon'])
    );
    expect([...mapSeasonTextToIds('January–February')]).toEqual(['cool_dry']);
    expect([...mapSeasonTextToIds('Jun–Aug')]).toEqual(['sw_monsoon']);
    // Wraps the year end.
    expect(new Set(mapSeasonTextToIds('Oct–Feb'))).toEqual(new Set(['ne_monsoon', 'cool_dry']));
  });

  it('prefers a named season over the months beside it', () => {
    expect([...mapSeasonTextToIds('Summer (Feb–May)')]).toEqual(['summer']);
  });

  it('treats "Year-round" like "Year Round"', () => {
    expect(mapSeasonTextToIds('Year-round in a managed home garden').size).toBe(4);
  });

  it('returns empty for unknown/blank text', () => {
    expect(mapSeasonTextToIds('').size).toBe(0);
    expect(mapSeasonTextToIds('whenever').size).toBe(0);
  });
});
