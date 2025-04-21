module Api
  class CannedResponseFoldersController < ApplicationController
    def index
      folders = CannedResponseFolder.all
      render json: folders
    end

    def show
      folder = CannedResponseFolder.find(params[:id])
      folder = folder.as_json
      responses = CannedResponse.where(folder_id: folder["_id"]).map do |response|
        {
          id: response._id.to_s,
          title: response.title
        }
      end

      folder = folder.merge(canned_responses: responses)
      render json: folder
    end
  end
end
