/**
 * 순수 SQL 쿼리 실행을 위한 유틸리티 함수들
 * Supabase JS ORM 대신 직접 SQL을 작성하고 싶을 때 사용
 */

import { supabaseAdmin } from '@src/lib/supabase';

/**
 * SQL 쿼리 실행 결과 타입
 */
export type SqlResult<T = any> = {
  data: T[] | null;
  error: Error | null;
};

/**
 * 순수 SQL 쿼리 실행 (매개변수 없음)
 * 
 * @example
 * ```typescript
 * const { data, error } = await executeSql(`
 *   SELECT * FROM profiles 
 *   WHERE group_id = 1 
 *   ORDER BY name
 * `);
 * ```
 */
export async function executeSql<T = any>(
  query: string
): Promise<SqlResult<T>> {
  try {
    const { data, error } = await supabaseAdmin.rpc('execute_sql_simple', {
      query_text: query,
    });

    if (error) {
      console.error('SQL 실행 오류:', error);
      return { data: null, error: new Error(error.message) };
    }

    // 결과 파싱
    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    // result 배열에서 실제 데이터 추출
    const results = data
      .map((row: any) => {
        if (row.result && Array.isArray(row.result)) {
          return row.result;
        }
        return row.result || row;
      })
      .flat()
      .filter((item: any) => item !== null);

    return { data: results as T[], error: null };
  } catch (err) {
    console.error('SQL 실행 중 예외 발생:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * 매개변수화된 SQL 쿼리 실행
 * 
 * 주의: SQL 인젝션 방지를 위해 숫자/불린 값만 직접 사용하고,
 * 문자열은 반드시 escapeSqlString 함수를 사용하세요.
 * 
 * @example
 * ```typescript
 * const { data, error } = await executeSqlWithParams(`
 *   SELECT * FROM profiles 
 *   WHERE group_id = ${1} AND cell_id = ${5}
 *   ORDER BY name
 * `);
 * ```
 */
export async function executeSqlWithParams<T = any>(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<SqlResult<T>> {
  try {
    // 매개변수가 있으면 쿼리에 직접 치환 (숫자/불린만 안전)
    let finalQuery = query;
    if (params && params.length > 0) {
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        if (typeof param === 'string') {
          // 문자열은 이스케이프 처리
          const escaped = param.replace(/'/g, "''");
          finalQuery = finalQuery.replace(placeholder, `'${escaped}'`);
        } else if (param === null) {
          finalQuery = finalQuery.replace(placeholder, 'NULL');
        } else {
          // 숫자나 불린은 그대로
          finalQuery = finalQuery.replace(placeholder, String(param));
        }
      });
    }

    const { data, error } = await supabaseAdmin.rpc('execute_sql_simple', {
      query_text: finalQuery,
    });

    if (error) {
      console.error('SQL 실행 오류:', error);
      return { data: null, error: new Error(error.message) };
    }

    // 결과 파싱
    if (!data || data.length === 0) {
      return { data: [], error: null };
    }

    const results = data
      .map((row: any) => {
        if (row.result && Array.isArray(row.result)) {
          return row.result;
        }
        return row.result || row;
      })
      .flat()
      .filter((item: any) => item !== null);

    return { data: results as T[], error: null };
  } catch (err) {
    console.error('SQL 실행 중 예외 발생:', err);
    return {
      data: null,
      error: err instanceof Error ? err : new Error(String(err)),
    };
  }
}

/**
 * SQL 문자열 이스케이프 (SQL 인젝션 방지)
 */
export function escapeSqlString(str: string): string {
  return str.replace(/'/g, "''");
}

/**
 * 단일 행 반환 쿼리 실행
 * 
 * @example
 * ```typescript
 * const { data, error } = await executeSqlSingle(`
 *   SELECT * FROM profiles 
 *   WHERE user_id = $1
 * `, ['user-123']);
 * ```
 */
export async function executeSqlSingle<T = any>(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<{ data: T | null; error: Error | null }> {
  const result = params
    ? await executeSqlWithParams<T>(query, params)
    : await executeSql<T>(query);

  if (result.error) {
    return { data: null, error: result.error };
  }

  if (!result.data || result.data.length === 0) {
    return { data: null, error: null };
  }

  return { data: result.data[0], error: null };
}

/**
 * INSERT, UPDATE, DELETE 같은 DML 쿼리 실행
 * 
 * @example
 * ```typescript
 * const { error } = await executeSqlDml(`
 *   UPDATE profiles 
 *   SET name = $1 
 *   WHERE user_id = $2
 * `, ['새 이름', 'user-123']);
 * ```
 */
export async function executeSqlDml(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<{ error: Error | null }> {
  const result = params
    ? await executeSqlWithParams(query, params)
    : await executeSql(query);

  return { error: result.error };
}

