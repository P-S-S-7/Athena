class DeviseCreateUsers < ActiveRecord::Migration[7.1]
    def change
        create_table :users, id: :bigint, options: "ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci" do |t|

            t.string :email, null: false
            t.string :full_name, null: true
            t.string :avatar_url, null: true
            t.string :provider, null: true
            t.string :uid, null: true    
            t.integer :role, null: false, default: 0

            t.timestamps null: false
        end

        add_index :users, :email, unique: true
    end
end
