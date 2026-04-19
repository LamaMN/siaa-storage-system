import sql from 'mssql';

const config: sql.config = {
    server: process.env.DB_SERVER || 'siaa.database.windows.net',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'Siaa',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    options: {
        encrypt: true,          // Required for Azure SQL
        trustServerCertificate: false,
        enableArithAbort: true,
        connectTimeout: 30000,
        requestTimeout: 30000,
    },
    pool: {
        max: 30,
        min: 0,
        idleTimeoutMillis: 30000,
    },
};

// Global connection pool (singleton pattern for Next.js)
declare global {
    // eslint-disable-next-line no-var
    var _sqlPool: sql.ConnectionPool | undefined;
}

async function getConnection(): Promise<sql.ConnectionPool> {
    // If pool exists and is connected and not closing, reuse it
    if (global._sqlPool && global._sqlPool.connected) {
        return global._sqlPool;
    }

    // If pool exists but is in a bad state, clean it up
    if (global._sqlPool) {
        try { await global._sqlPool.close(); } catch { /* ignore */ }
        global._sqlPool = undefined;
    }

    try {
        const pool = new sql.ConnectionPool(config);
        await pool.connect();

        global._sqlPool = pool;

        pool.on('error', (err) => {
            console.error('SQL Pool Error:', err);
            global._sqlPool = undefined;
        });

        console.log('✅ Connected to Azure SQL Database');
        return pool;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        global._sqlPool = undefined;
        throw new Error(`Unable to connect to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Execute a parameterized SQL query
 * @param sql - SQL string with @param placeholders
 * @param params - Record of parameter names to values
 */
async function query<T = Record<string, unknown>>(
    queryString: string,
    params?: Record<string, unknown>
): Promise<sql.IRecordSet<T>> {
    const pool = await getConnection();
    const request = pool.request();

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
    }

    const result = await request.query<T>(queryString);
    return result.recordset;
}

/**
 * Execute a query returning a single row or null
 */
async function queryOne<T = Record<string, unknown>>(
    queryString: string,
    params?: Record<string, unknown>
): Promise<T | null> {
    const rows = await query<T>(queryString, params);
    return rows.length > 0 ? rows[0] : null;
}

/**
 * Execute an INSERT / UPDATE / DELETE statement
 */
async function execute(
    queryString: string,
    params?: Record<string, unknown>
): Promise<sql.IResult<unknown>> {
    const pool = await getConnection();
    const request = pool.request();

    if (params) {
        for (const [key, value] of Object.entries(params)) {
            request.input(key, value);
        }
    }

    return await request.query(queryString);
}

export { getConnection, query, queryOne, execute, sql };
export default { getConnection, query, queryOne, execute };
