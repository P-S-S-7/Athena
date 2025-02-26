# frozen_string_literal: true

class DeviseCreateUsers < ActiveRecord::Migration[7.1]
  def change
		create_table :users do |t|
      t.string :email, null: false
      t.string :full_name
      t.integer :role, default: 0
      t.timestamps null: false
    end

    add_index :users, :email, unique: true
	end
end
