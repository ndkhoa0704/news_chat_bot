import { Pool } from "pg";

function PostgresService() {
    const SELF = {
        pool: new Pool({
            connectionString: process.env.POSTGRES_URI,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
            maxLifetimeSeconds: 60
        }),
    }

    return {
        /**
         * Execute a single SQL query in a single transaction   
         * @param {string} query - SQL query to execute
         * @param {any[]} params - Parameters for the query
         * @returns {Promise<any[]>} - Result of the query
         */
        executeSQL: async (query, params) => {
            const client = await SELF.pool.connect();
            try {
                await client.query('BEGIN');
                const result = await client.query(query, params);
                await client.query('COMMIT');
                return result.rows;
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        },
        /**
         * Execute multiple SQL queries in a single transaction
         * @param {string[]} queries - Array of SQL queries to execute
         * @param {any[][]} paramsArray - Array of parameter arrays for each query
         * @returns {Promise<any[]>} - Array of results from each query
         */
        executeMultipleSQL: async (queries, paramsArray) => {
            const client = await SELF.pool.connect();
            try {
                await client.query('BEGIN');
                const results = await Promise.all(queries.map((query, index) => client.query(query, paramsArray[index])));
                await client.query('COMMIT');
                return results.map(result => result.rows);
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }
        }
    }
}

export default PostgresService();