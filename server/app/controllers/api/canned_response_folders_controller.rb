module Api
  class CannedResponseFoldersController < ApplicationController
    def index
      freshdesk_service = Freshdesk::CannedResponseService.new
      folders = freshdesk_service.list_folders
      render json: folders
    end

    def show
      freshdesk_service = Freshdesk::CannedResponseService.new
      folder = freshdesk_service.get_folder(params[:id])
      render json: folder
    end
  end
end
