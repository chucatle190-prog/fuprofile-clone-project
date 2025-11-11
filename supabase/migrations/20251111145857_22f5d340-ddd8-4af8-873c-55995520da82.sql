-- Add princess_rescue to the allowed game types
ALTER TABLE game_scores DROP CONSTRAINT IF EXISTS game_scores_game_type_check;

ALTER TABLE game_scores ADD CONSTRAINT game_scores_game_type_check 
CHECK (game_type IN ('spin_wheel', 'word_puzzle', 'memory_match', 'princess_rescue'));