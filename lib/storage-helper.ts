import { supabase } from './supabase';

// ID mapping: old numeric ID -> new UUID
const idMapping = new Map<string, string>();

/**
 * Storage helper that mimics window.storage API but uses Supabase
 * Stores everything as JSONB for maximum flexibility
 */

export const storageHelper = {
  async get(key: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (key === 'bps_pro_blocks') {
        // Get blocks - stored as JSONB in managing_agent column
        const { data, error } = await supabase
          .from('blocks')
          .select('id, name, short_name, address, height, managing_agent, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching blocks:', error);
          return null;
        }

        return {
          key,
          value: JSON.stringify(data || []),
          shared: false
        };
      }

      if (key === 'bps_pro_block_data') {
        // Get block data
        const { data, error } = await supabase
          .from('block_data')
          .select('block_id, data')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching block data:', error);
          return null;
        }

        // Convert array to object keyed by block_id
        const blockDataObj: any = {};
        if (data) {
          data.forEach((item: any) => {
            if (item.block_id && item.data) {
              blockDataObj[item.block_id] = item.data;
            }
          });
        }

        return {
          key,
          value: JSON.stringify(blockDataObj),
          shared: false
        };
      }

      return null;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },

  async set(key: string, value: string, shared?: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (key === 'bps_pro_blocks') {
        const blocks = JSON.parse(value);
        
        // Prepare blocks for Supabase - convert numeric IDs to UUIDs
        const blocksToSave = blocks.map((block: any) => {
          const oldId = block.id;
          let blockId = oldId;
          const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(blockId);
          
          if (!blockId || !isValidUUID) {
            blockId = crypto.randomUUID();
            // Store mapping from old numeric ID to new UUID
            if (oldId) {
              idMapping.set(String(oldId), blockId);
            }
          }

          return {
            id: blockId,
            user_id: user.id,
            name: block.name || '',
            short_name: block.shortName || block.short_name || '',
            address: block.address || '',
            height: block.height || 'Under 11m',
            managing_agent: block.managingAgent || block.managing_agent || {},
            created_at: block.created_at || new Date().toISOString()
          };
        });

        // Delete all existing blocks for this user
        await supabase
          .from('blocks')
          .delete()
          .eq('user_id', user.id);

        // Insert new blocks
        if (blocksToSave.length > 0) {
          const { error } = await supabase
            .from('blocks')
            .insert(blocksToSave);

          if (error) {
            console.error('Error saving blocks:', error);
            throw error;
          }
        }

        return { key, value, shared: shared || false };
      }

      if (key === 'bps_pro_block_data') {
        const blockDataObj = JSON.parse(value);
        
        // Convert object to array of records - use mapped UUIDs for block_id
        const blockDataArray = Object.keys(blockDataObj).map(blockId => ({
          block_id: idMapping.get(String(blockId)) || blockId, // Use mapped UUID if available
          user_id: user.id,
          data: blockDataObj[blockId],
          updated_at: new Date().toISOString()
        }));

        // Delete all existing block data for this user
        await supabase
          .from('block_data')
          .delete()
          .eq('user_id', user.id);

        // Insert new block data
        if (blockDataArray.length > 0) {
          const { error } = await supabase
            .from('block_data')
            .insert(blockDataArray);

          if (error) {
            console.error('Error saving block data:', error);
            // Don't throw here - blocks are already saved, this is secondary data
            console.warn('Block data save failed, but blocks are saved');
          }
        }

        return { key, value, shared: shared || false };
      }

      return null;
    } catch (error) {
      console.error('Storage set error:', error);
      throw error; // Re-throw to see the actual error
    }
  },

  async delete(key: string, shared?: boolean) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (key === 'bps_pro_blocks') {
        await supabase
          .from('blocks')
          .delete()
          .eq('user_id', user.id);

        // Clear ID mapping when blocks are deleted
        idMapping.clear();

        return { key, deleted: true, shared: shared || false };
      }

      if (key === 'bps_pro_block_data') {
        await supabase
          .from('block_data')
          .delete()
          .eq('user_id', user.id);

        return { key, deleted: true, shared: shared || false };
      }

      return null;
    } catch (error) {
      console.error('Storage delete error:', error);
      return null;
    }
  },

  async list(prefix?: string, shared?: boolean) {
    return {
      keys: ['bps_pro_blocks', 'bps_pro_block_data'],
      prefix,
      shared: shared || false
    };
  }
};

// Create a window.storage polyfill
if (typeof window !== 'undefined') {
  (window as any).storage = storageHelper;
}
