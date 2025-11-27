import { useEffect, useState } from 'react';

export interface CellItem {
  id: number;
  name: string;
  hub_group_id: number;
}

export function useCells(groupId: number | '') {
  const [cells, setCells] = useState<CellItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCells = async () => {
    if (!groupId) {
      setCells([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/common/cells?group_id=${groupId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setCells(data);
      }
    } catch (err) {
      console.error('셀 목록 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCells();
  }, [groupId]);

  return { cells, loading, refreshCells: fetchCells };
}
