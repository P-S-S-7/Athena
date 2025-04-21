class CreateAvatars < ActiveRecord::Migration[7.1]
    def change
        create_table :avatars do |t|
            t.string :name
            t.string :content_type
            t.integer :size
            t.text :attachment_url
            t.references :contact, null: false, foreign_key: true
            t.datetime :created_at
            t.datetime :updated_at
        end
    end
end
